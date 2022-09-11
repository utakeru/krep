export {};
import '../css/contentScript.scss';

(() => {
  // 投稿日時からコメントの内容を取得するためのオブジェクト
  const linkToComment: {[key: string]: string} = {};

  // Popup要素をbodyに追加
  const popupEl = document.createElement('div');
  popupEl.className = 'krep-popup';
  popupEl.innerText = 'text';
  popupEl.style.position = 'absolute';
  popupEl.style.display = 'none';
  document.body.appendChild(popupEl);

  const normalizeLink = (url: string) => {
    return url.replace(/^(https:\/\/\w+)\.s\./, '$1.');
  }

  const makeKrepActionEl = () => {
    const krepActionEl = document.createElement('li');

    const krepActionLinkEl = document.createElement('a');
    krepActionLinkEl.className = 'ocean-ui-comments-commentbase-krep';
    krepActionLinkEl.style.userSelect = 'none';
    krepActionLinkEl.innerHTML = "💬リンク付きで返信";

    krepActionEl.appendChild(krepActionLinkEl);
    return krepActionEl;
  };

  const makeReplyLink = (src: HTMLElement, editorSrc: HTMLElement) => {
    const actionsRoot = src.querySelector('.ocean-ui-comments-commentbase-actions') as HTMLElement;
    const krepActionEl = makeKrepActionEl();

    const replyUser = (src.querySelector('.ocean-ui-comments-commentbase-name') as HTMLElement)?.innerText;
    const replyUserIcon = src.querySelector('.ocean-ui-comments-commentbase-usericon') as HTMLElement;
    const content = src.querySelector('.ocean-ui-comments-commentbase-contents')?.innerHTML;
    // ポップアップで送信者アイコン、送信者名、コメント内容を表示する
    const href = src.querySelector('.ocean-ui-comments-commentbase-time a')?.attributes.getNamedItem('href')?.value;
    if (href) {
      linkToComment[href] = replyUserIcon.outerHTML + replyUser + content;
    }

    krepActionEl.addEventListener("click", () => {
      const reply = src.querySelector('.ocean-ui-comments-commentbase-comment') as HTMLElement;
      reply.click();
      getEditorField(editorSrc).then(([document, editorField]) => {
        if (href) {
          addReplyLinkToEditorField(href, editorField);
        }
        moveCursorToEnd(document, editorField);
      });
    });
    if(!actionsRoot.querySelector('.ocean-ui-comments-commentbase-krep')) {
      actionsRoot.appendChild(krepActionEl);
    }
  };

  const getEditorField = (editorSrc: HTMLElement): Promise<[Document, HTMLElement]> => {
    let editorField = editorSrc.querySelector('.ocean-ui-editor-field') as HTMLElement;
    if (editorField.tagName.toLowerCase() === 'iframe') {
      return new Promise((resolve) => {
        editorField.addEventListener('load', () => {
          resolve([editorField.ownerDocument,
                   editorField.ownerDocument.querySelector('.editable') as HTMLElement]);
        }, {'once': true});
      });
    }
    return Promise.resolve([document, editorField]);
  };

  const addReplyLinkToEditorField = (href: string, editorField: HTMLElement) => {
    const aTag = document.createElement('a');

    aTag.href = href;
    aTag.innerHTML = "💬";
    // リッチエディタにclass名を付与して送信すると「user-token」のprefixが付くので
    // 送信後のclass名は「user-token-reply-link-button」になる
    aTag.className = "reply-link-button";
    editorField.innerHTML = aTag.outerHTML + "<span>&nbsp;</span>" + (editorField.innerHTML === "<br>" ? "" : editorField.innerHTML);
  };

  const moveCursorToEnd = (document: Document, node: Node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    const selection = document.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  // コメントリンクから内容を取得する。取得出来なかった場合は、古いコメントを展開する旨のダイアログを表示
  const getComment = (link: string, parentPost: HTMLElement | undefined): string | null => {
    const comment = linkToComment[link];
    if(comment) {
      return comment
    } else if(parentPost) {
      const moreCommentEl = parentPost.querySelector('.ocean-ui-comments-post-morecomment') as HTMLElement;
      if (!moreCommentEl) {
        return null;
      }
      if (moreCommentEl.style.display !== "none") {
        const popupEl = document.querySelector('.krep-popup') as HTMLElement;
        popupEl.style.display = 'none';
        if(window.confirm('コメントが見つかりません。古いコメントを展開しますか？')){
          moreCommentEl.click();
        }
      } else {
        return "コメントが見つかりません。削除されたか、別な場所にある可能性があります。";
      }
      return null;
    }
    return null;
  };

  const popupSetup = (e: MouseEvent, content: string | null) => {
    const popupEl = document.querySelector('.krep-popup') as HTMLElement;
    popupEl.style.display = 'block';
    popupEl.style.left = (e.pageX-popupEl.clientWidth) > 0 ? (e.pageX-popupEl.clientWidth) + 'px' : '0px';
    popupEl.style.top = (e.pageY-popupEl.clientHeight*1.2) + 'px';
    popupEl.innerHTML = content ?? '';
  };

  const handlePopupShow = (reply: HTMLElement, post: HTMLElement | undefined) => {
    reply.addEventListener("mouseover", (e: MouseEvent) => {
      const normalizedLink = normalizeLink((e.target as HTMLAnchorElement).href);
      if(post) {
        popupSetup(e, getComment(normalizedLink, post));
      } else {
        popupSetup(e, getComment(normalizedLink, undefined));
      }
    });
    reply.addEventListener("mouseout", () => {
      const popupEl = document.querySelector('.krep-popup') as HTMLElement;
      popupEl.style.display = 'none';
    });
  };

  const observerCommentComponent = () => {
    for(let reply of Array.from(document.querySelectorAll('.user-token-reply-link-button'))) {
      handlePopupShow((reply as HTMLElement), undefined);
    }
    // 既にあるポストに対してEventHandlerを付与
    for(let post of Array.from(document.querySelectorAll('.ocean-ui-comments-post'))) {
      const postEl = post as HTMLElement;
      makeReplyLink(postEl, postEl);

      if(!postEl.querySelector('.ocean-ui-comments-post-commentholder')) continue;
      new MutationObserver((postComponentMutations) => {
        postComponentMutations.forEach((postComponentMutation) => {
          // コメントが追加されたら、コメントにEventHandlerを付与
          postComponentMutation.addedNodes.forEach((commentNode) => {
            const commentEl = commentNode as HTMLElement;
            makeReplyLink(commentEl, postEl);
            const reply = commentEl.querySelector('.user-token-reply-link-button') as HTMLElement;
            if(reply) {
              handlePopupShow(reply, postEl);
            }
          })
        });
      }).observe(postEl.querySelector('.ocean-ui-comments-post-commentholder') as HTMLElement, {
        childList: true, characterData: true
      });
      // 既にあるポストのコメントに対してEventHandlerを付与
      for(let comment of Array.from(postEl.querySelectorAll('.ocean-ui-comments-comment'))) {
        makeReplyLink((comment as HTMLElement), postEl);
        const reply = comment.querySelector('.user-token-reply-link-button') as HTMLElement;
        if(reply) {
          handlePopupShow(reply, postEl);
        }
      }
    }
    // ポスト追加を監視
    new MutationObserver((commentComponentMutations) => {
      commentComponentMutations.forEach((commentComponentMutation) => {
        commentComponentMutation.addedNodes.forEach((postNode) => {
          const postEl = postNode as HTMLElement;
          makeReplyLink(postEl, postEl);
          for(let comment of Array.from(postEl.querySelectorAll('.ocean-ui-comments-comment'))) {
            makeReplyLink((comment as HTMLElement), postEl);
            const reply = comment.querySelector('.user-token-reply-link-button') as HTMLElement;
            if(reply) {
              handlePopupShow(reply, postEl);
            }
          }

          // コメント追加を監視
          new MutationObserver((postComponentMutations) => {
            postComponentMutations.forEach((postComponentMutation) => {
              postComponentMutation.addedNodes.forEach((commentNode) => {
                const commentEl = commentNode as HTMLElement;
                makeReplyLink(commentEl, postEl);
                const reply = commentEl.querySelector('.user-token-reply-link-button') as HTMLElement;
                if(reply) {
                  handlePopupShow(reply, undefined);
                }
              });
            })
          }).observe(postEl.querySelector('.ocean-ui-comments-post-commentholder') as HTMLElement, {
            childList: true, characterData: true
          });
        });
      });
    }).observe(document.querySelector('.ocean-ui-comments-commentcomponent') as HTMLElement, {
      childList: true, characterData: true
    });
  };

  let oceanBodyDivObserver: MutationObserver | null = null;
  let oceanBodyObserver: MutationObserver | null = null;
  if(document.querySelector('#contents-body-ocean')) {
    // ocean-contents-bodyをobserveし、divでsubtreeに対して、comment-componentをobserveする
    oceanBodyObserver = new MutationObserver((oceanBodyMutations) => {
      oceanBodyMutations.forEach((oceanBodyMutation) => {
        if(oceanBodyMutation.addedNodes && oceanBodyMutation.addedNodes.length > 0) {
          const popupEl = document.querySelector('.krep-popup') as HTMLElement;
          popupEl.style.display = 'none';
          // ocean-contents-bodyの子Divを監視
          oceanBodyDivObserver = new MutationObserver((oceanBodyDivMutations) => {
            oceanBodyDivMutations.some(() => {
              if(!document.querySelector('.ocean-ui-comments-commentcomponent')) {
                return;
              }

              // 通知画面用
              if(document.querySelector('.gaia-argoui-ntf-twopane-contents')) {
                new MutationObserver((twopaneContentsMutations) => {
                  twopaneContentsMutations.forEach((twopaneContentsMutation) => {
                    let twopaneContentsDivObserver: MutationObserver | null = null;;
                    if(twopaneContentsMutation.addedNodes && twopaneContentsMutation.addedNodes.length > 0) {
                      twopaneContentsDivObserver = new MutationObserver((twopaneContentsDivMutations) => {
                        twopaneContentsDivMutations.some(() => {
                          if(!document.querySelector('.ocean-ui-comments-commentcomponent')) {
                            return;
                          }

                          observerCommentComponent();
                          twopaneContentsDivObserver?.disconnect();
                          return true;
                        });
                      });
                      twopaneContentsDivObserver.observe(document.querySelector('.gaia-argoui-ntf-twopane-contents div') as HTMLElement, {
                        childList: true, subtree: true
                      });
                    }
                  });
                }).observe(document.querySelector('.gaia-argoui-ntf-twopane-contents') as HTMLElement, {
                  childList: true
                });
              }

              observerCommentComponent();
              oceanBodyDivObserver?.disconnect();
              return true;
            });
          });
          oceanBodyDivObserver.observe(document.querySelector('#contents-body-ocean div') as HTMLElement, {
            childList: true, subtree: true
          })
        }
      })
    });
    oceanBodyObserver.observe(document.querySelector('#contents-body-ocean') as HTMLElement, {
      childList: true
    });
  }
  
  window.addEventListener('hashchange', () => {
    debugger;
    observerCommentComponent();
  })
})();
