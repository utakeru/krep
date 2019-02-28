'use strict';
{
  // 投稿日時からコメントの内容を取得するためのオブジェクト
  const linkToComment = {};

  // Popup要素をbodyに追加
  const popupEl = document.createElement('div');
  popupEl.className = 'krep-popup';
  popupEl.innerText = 'text';
  popupEl.style.position = 'absolute';
  popupEl.style.display = 'none';
  document.querySelector('body').appendChild(popupEl);

  const makeKrepActionEl = () => {
    const krepActionEl = document.createElement('li');

    const krepActionLinkEl = document.createElement('a');
    krepActionLinkEl.className = 'ocean-ui-comments-commentbase-krep';
    krepActionLinkEl.style.userSelect = 'none';
    krepActionLinkEl.innerHTML = "💬リンク付きで返信";

    krepActionEl.appendChild(krepActionLinkEl);
    return krepActionEl;
  };

  const makeReplyLink = (src, editorSrc) => {
    const actionsRoot = src.querySelector('.ocean-ui-comments-commentbase-actions');
    const krepActionEl = makeKrepActionEl();

    const replyUser = src.querySelector('.ocean-ui-comments-commentbase-name').innerText;
    const replyUserIcon = src.querySelector('.ocean-ui-comments-commentbase-usericon');
    const content = src.querySelector('.ocean-ui-comments-commentbase-contents').innerHTML;
    // ポップアップで送信者アイコン、送信者名、コメント内容を表示する
    const href = src.querySelector('.ocean-ui-comments-commentbase-time a').attributes['href'].value;
    linkToComment[href] = replyUserIcon.outerHTML + replyUser + content;

    krepActionEl.addEventListener("click", () => {
      const reply = src.querySelector('.ocean-ui-comments-commentbase-comment');
      reply.click();
      getEditorField(editorSrc).then(([document, editorField]) => {
        addReplyLinkToEditorField(href, editorField);
        moveCursorToEnd(document, editorField);
      });
    });
    if(!actionsRoot.querySelector('.ocean-ui-comments-commentbase-krep')) {
      actionsRoot.appendChild(krepActionEl);
    }
  };

  const getEditorField = (editorSrc) => {
    let editorField = editorSrc.querySelector('.ocean-ui-editor-field');
    if (editorField.tagName.toLowerCase() === 'iframe') {
      return new Promise((resolve, reject) => {
        editorField.addEventListener('load', () => {
          resolve([editorField.contentDocument,
                   editorField.contentDocument.querySelector('.editable')]);
        }, {'once': true});
      });
    }
    return Promise.resolve([document, editorField]);
  };

  const addReplyLinkToEditorField = (href, editorField) => {
    const aTag = document.createElement('a');

    aTag.href = href;
    aTag.innerHTML = "💬";
    // リッチエディタにclass名を付与して送信すると「user-token」のprefixが付くので
    // 送信後のclass名は「user-token-reply-link-button」になる
    aTag.className = "reply-link-button";
    const emptySpan = document.createElement('span');
    editorField.innerHTML = aTag.outerHTML + "<span>&nbsp;</span>" + (editorField.innerHTML === "<br>" ? "" : editorField.innerHTML);
  };

  const moveCursorToEnd = (document, node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    const selection = document.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  };

  // コメントリンクから内容を取得する。取得出来なかった場合は、古いコメントを展開する旨のダイアログを表示
  const getComment = (link, parentPost) => {
    const comment = linkToComment[link];
    if(comment) {
      return comment
    } else if(parentPost) {
      if (parentPost.querySelector('.ocean-ui-comments-post-morecomment').style.display !== "none") {
        const popupEl = document.querySelector('.krep-popup');
        popupEl.style.display = 'none';
        if(window.confirm('コメントが見つかりません。古いコメントを展開しますか？')){
          parentPost.querySelector('.ocean-ui-comments-post-morecomment').click();
        }
      } else {
        return "コメントが見つかりません。削除されたか、別な場所にある可能性があります。";
      }
      return;
    }
  };

  const popupSetup = (e, content) => {
    const popupEl = document.querySelector('.krep-popup');
    popupEl.style.display = 'block';
    popupEl.style.left = (e.pageX-popupEl.clientWidth) > 0 ? (e.pageX-popupEl.clientWidth) + 'px' : '0px';
    popupEl.style.top = (e.pageY-popupEl.clientHeight*1.2) + 'px';
    popupEl.innerHTML = content;
  };

  const handlePopupShow = (reply, post) => {
    reply.addEventListener("mouseover", (e) => {
      if(post) {
        popupSetup(e, getComment(e.target.href, post));
      } else {
        popupSetup(e, getComment(e.target.href));
      }
    });
    reply.addEventListener("mouseout", (e) => {
      const popupEl = document.querySelector('.krep-popup');
      popupEl.style.display = 'none';
    });
  };

  const observerCommentComponent = () => {
    for(let reply of document.querySelectorAll('.user-token-reply-link-button')) {
      handlePopupShow(reply);
    }
    // 既にあるポストに対してEventHandlerを付与
    for(let post of document.querySelectorAll('.ocean-ui-comments-post')) {
      makeReplyLink(post, post);

      if(!post.querySelector('.ocean-ui-comments-post-commentholder')) continue;
      new MutationObserver((postComponentMutations, postComponentObserver) => {
        postComponentMutations.forEach((postComponentMutation) => {
          // コメントが追加されたら、コメントにEventHandlerを付与
          postComponentMutation.addedNodes.forEach((commentNode) => {
            makeReplyLink(commentNode, post);
            const reply = commentNode.querySelector('.user-token-reply-link-button');
            if(reply) {
              handlePopupShow(reply, post);
            }
          })
        });
      }).observe(post.querySelector('.ocean-ui-comments-post-commentholder'), {
        childList: true, characterData: true
      });
      // 既にあるポストのコメントに対してEventHandlerを付与
      for(let comment of post.querySelectorAll('.ocean-ui-comments-comment')) {
        makeReplyLink(comment, post);
        const reply = comment.querySelector('.user-token-reply-link-button');
        if(reply) {
          handlePopupShow(reply, post);
        }
      }
    }
    // ポスト追加を監視
    new MutationObserver((commentComponentMutations) => {
      commentComponentMutations.forEach((commentComponentMutation) => {
        commentComponentMutation.addedNodes.forEach((postNode) => {
          makeReplyLink(postNode, postNode);
          for(let comment of postNode.querySelectorAll('.ocean-ui-comments-comment')) {
            makeReplyLink(comment, postNode);
            const reply = comment.querySelector('.user-token-reply-link-button');
            if(reply) {
              handlePopupShow(reply, postNode);
            }
          }

          // コメント追加を監視
          new MutationObserver((postComponentMutations, postComponentObserver) => {
            postComponentMutations.forEach((postComponentMutation) => {
              postComponentMutation.addedNodes.forEach((commentNode) => {
                makeReplyLink(commentNode, postNode);
                const reply = commentNode.querySelector('.user-token-reply-link-button');
                if(reply) {
                  handlePopupShow(reply);
                }
              });
            })
          }).observe(postNode.querySelector('.ocean-ui-comments-post-commentholder'), {
            childList: true, characterData: true
          });
        });
      });
    }).observe(document.querySelector('.ocean-ui-comments-commentcomponent'), {
      childList: true, characterData: true
    });
  };

  let oceanBodyDivObserver;
  let oceanBodyObserver;
  if(document.querySelector('#contents-body-ocean')) {
    // ocean-contents-bodyをobserveし、divでsubtreeに対して、comment-componentをobserveする
    oceanBodyObserver = new MutationObserver((oceanBodyMutations) => {
      oceanBodyMutations.forEach((oceanBodyMutation) => {
        if(oceanBodyMutation.addedNodes && oceanBodyMutation.addedNodes.length > 0) {
          const popupEl = document.querySelector('.krep-popup');
          popupEl.style.display = 'none';
          // ocean-contents-bodyの子Divを監視
          oceanBodyDivObserver = new MutationObserver((oceanBodyDivMutations) => {
            oceanBodyDivMutations.some((oceanBodyMutation) => {
              if(!document.querySelector('.ocean-ui-comments-commentcomponent')) {
                return;
              }

              // 通知画面用
              if(document.querySelector('.gaia-argoui-ntf-twopane-contents')) {
                new MutationObserver((twopaneContentsMutations) => {
                  twopaneContentsMutations.forEach((twopaneContentsMutation) => {
                    let twopaneContentsDivObserver;
                    if(twopaneContentsMutation.addedNodes && twopaneContentsMutation.addedNodes.length > 0) {
                      twopaneContentsDivObserver = new MutationObserver((twopaneContentsDivMutations) => {
                        twopaneContentsDivMutations.some((twopaneContentsMutation) => {
                          if(!document.querySelector('.ocean-ui-comments-commentcomponent')) {
                            return;
                          }

                          observerCommentComponent();
                          twopaneContentsDivObserver.disconnect();
                          return true;
                        });
                      });
                      twopaneContentsDivObserver.observe(document.querySelector('.gaia-argoui-ntf-twopane-contents div'), {
                        childList: true, subtree: true
                      });
                    }
                  });
                }).observe(document.querySelector('.gaia-argoui-ntf-twopane-contents'), {
                  childList: true
                });
              }

              observerCommentComponent();
              oceanBodyDivObserver.disconnect();
              return true;
            });
          });
          oceanBodyDivObserver.observe(document.querySelector('#contents-body-ocean div'), {
            childList: true, subtree: true
          })
        }
      })
    });
    oceanBodyObserver.observe(document.querySelector('#contents-body-ocean'), {
      childList: true
    });
  }
};
