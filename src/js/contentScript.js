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

  function makeReplyLink(src, editorSrc) {
    const reply = src.querySelector('.ocean-ui-comments-commentbase-comment');
    const replyUser = src.querySelector('.ocean-ui-comments-commentbase-name').innerText;
    const replyUserIcon = src.querySelector('.ocean-ui-comments-commentbase-usericon');
    const content = src.querySelector('.ocean-ui-comments-commentbase-contents').innerHTML;
    const href = src.querySelector('.ocean-ui-comments-commentbase-time a').attributes['href'].value;
    linkToComment[href] = replyUserIcon.outerHTML + replyUser + content;
    reply.addEventListener("click", () => {
      const editorField = editorSrc.querySelector('.ocean-ui-editor-field');
      const aTag = document.createElement('a');
      aTag.href = href;
      aTag.innerHTML = "&gt;&gt;&nbsp;";
      aTag.className = "reply-link-button";
      editorField.innerHTML = (editorField.innerHTML === "<br>" ? "" : editorField.innerHTML) + aTag.outerHTML;
    });
  }

  function getComment(link, parentPost) {
    const comment = linkToComment[link];
    if(comment) {
      return comment
    } else if(parentPost) {
      const popupEl = document.querySelector('.krep-popup');
      popupEl.style.display = 'none';
      if(window.confirm('コメントが見つかりません。古いコメントを展開しますか？')){
        parentPost.querySelector('.ocean-ui-comments-post-morecomment').click();
      }
      return;
    }
  }

  function popupSetup(e, content) {
    const popupEl = document.querySelector('.krep-popup');
    popupEl.style.display = 'block';
    popupEl.style.left = (e.pageX-popupEl.clientWidth) > 0 ? (e.pageX-popupEl.clientWidth) + 'px' : '0px';
    popupEl.style.top = (e.pageY-popupEl.clientHeight*1.2) + 'px';
    popupEl.innerHTML = content;
  }

  function handleReply(reply, post) {
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
  }

  let oceanBodyDivObserver;

  // ocean-contents-bodyをobserveし、divでsubtreeに対して、comment-componentをobserveする
  new MutationObserver((oceanBodyMutations) => {
    oceanBodyMutations.forEach((oceanBodyMutation) => {
      if(oceanBodyMutation.addedNodes && oceanBodyMutation.addedNodes.length > 0) {
        // ocean-contents-bodyの子Divを監視
        oceanBodyDivObserver = new MutationObserver((oceanBodyDivMutations) => {
          oceanBodyDivMutations.some((oceanBodyMutation) => {
            if(!document.querySelector('.ocean-ui-comments-commentcomponent')) {
              return;
            }
            for(let reply of document.querySelectorAll('.user-token-reply-link-button')) {
              handleReply(reply);
            }
            // 既にあるポストに対して返信EventHandlerと監視を付与
            for(let post of document.querySelectorAll('.ocean-ui-comments-post')) {
              // 返信ボタンを押されたときのEventをhandlerを付与
              makeReplyLink(post, post);
              // ポストにコメント追加を監視するObserverを付与
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

            oceanBodyDivObserver.disconnect();
            return true;
          });
        });
        oceanBodyDivObserver.observe(document.querySelector('#contents-body-ocean div'), {
          childList: true, subtree: true
        })
      }
    })
  }).observe(document.querySelector('#contents-body-ocean'), {
    childList: true
  });
};
