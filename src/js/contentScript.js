'use strict';
{
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

    const reply = src.querySelector('.ocean-ui-comments-commentbase-comment');
    const replyUser = src.querySelector('.ocean-ui-comments-commentbase-name').innerText;
    const replyUserIcon = src.querySelector('.ocean-ui-comments-commentbase-usericon');
    const content = src.querySelector('.ocean-ui-comments-commentbase-contents').innerHTML;
    const href = src.querySelector('.ocean-ui-comments-commentbase-time a').attributes['href'].value;
    linkToComment[href] = replyUserIcon.outerHTML + replyUser + content;
    krepActionEl.addEventListener("click", () => {
      reply.click();
      const editorField = editorSrc.querySelector('.ocean-ui-editor-field');
      const aTag = document.createElement('a');
      aTag.href = href;
      aTag.innerHTML = "💬";
      aTag.className = "reply-link-button";
      const emptySpan = document.createElement('span');
      editorField.innerHTML = aTag.outerHTML + "<span>&nbsp;</span>" + (editorField.innerHTML === "<br>" ? "" : editorField.innerHTML) + "<br>";
      moveCursorToEnd(editorField);
    });
    actionsRoot.appendChild(krepActionEl);
  };

  const moveCursorToEnd = (node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  };

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

  const handleReply = (reply, post) => {
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
      handleReply(reply);
    }
    // 既にあるポストに対して返信EventHandlerと監視を付与
    for(let post of document.querySelectorAll('.ocean-ui-comments-post')) {
      // 返信ボタンを押されたときのEventをhandlerを付与
      makeReplyLink(post, post);
      // ポストにコメント追加を監視するObserverを付与
      if(!post.querySelector('.ocean-ui-comments-post-commentholder')) continue;
      new MutationObserver((postComponentMutations, postComponentObserver) => {
        postComponentMutations.forEach((postComponentMutation) => {
          postComponentMutation.addedNodes.forEach((commentNode) => {
            makeReplyLink(commentNode, post);
            const reply = commentNode.querySelector('.user-token-reply-link-button');
            if(reply) {
              handleReply(reply, post);
            }
          })
        });
      }).observe(post.querySelector('.ocean-ui-comments-post-commentholder'), {
        childList: true, characterData: true
      });
      for(let comment of post.querySelectorAll('.ocean-ui-comments-comment')) {
        makeReplyLink(comment, post);
        const reply = comment.querySelector('.user-token-reply-link-button');
        if(reply) {
          handleReply(reply, post);
        }
      }
    }
    // ポスト追加を監視
    new MutationObserver((commentComponentMutations) => {
      commentComponentMutations.forEach((commentComponentMutation) => {
        commentComponentMutation.addedNodes.forEach((postNode) => {
          makeReplyLink(postNode, postNode);
          // Listenerを付与
          for(let comment of postNode.querySelectorAll('.ocean-ui-comments-comment')) {
            makeReplyLink(comment, postNode);
            const reply = comment.querySelector('.user-token-reply-link-button');
            if(reply) {
              handleReply(reply, postNode);
            }
          }

          // コメント追加を監視
          new MutationObserver((postComponentMutations, postComponentObserver) => {
            postComponentMutations.forEach((postComponentMutation) => {
              postComponentMutation.addedNodes.forEach((commentNode) => {
                makeReplyLink(commentNode, postNode);
                const reply = commentNode.querySelector('.user-token-reply-link-button');
                if(reply) {
                  handleReply(reply);
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
