export const addHandlersToComment = (
    handlers: Array<(commentBaseEntity: HTMLElement) => void>
  ): MutationObserver | null => {
    const contentsBodyOceanEl = document.querySelector("#contents-body-ocean");

    if (!contentsBodyOceanEl) return null;
  
    // Contents Body Ocean読み込み時にすでにCommentBaseなどが入っているのでとりあえず全部に対してhandlerを実行する
    Array.from(
      document.querySelectorAll(".ocean-ui-comments-commentbase-entity")
    ).forEach((commentBaseEntity) => {
      handlers.forEach((handler) => handler(commentBaseEntity as HTMLElement));
    });
  
    const contentsBodyOceanObs = new MutationObserver(() => {
      const commentComponentEl = document.querySelector(
        ".ocean-ui-comments-commentcomponent"
      );
      if (commentComponentEl) {
        // Comment Component読み込み時にすでにCommentBaseなどが入っているのでとりあえず全部に対してhandlerを実行する
        // 2回発火observeしているかも、hashchangeのときは別の対応が必要かも
        // hashchangeのときはcommentComponentなし→ありで2回呼ばれてる
        Array.from(
          document.querySelectorAll(".ocean-ui-comments-commentbase-entity")
        ).forEach((commentBaseEntity) => {
          handlers.forEach((handler) => handler(commentBaseEntity as HTMLElement));
        });
  
        // Commentが追加されたり、削除されたりするので監視する
        // bodyOceanの監視のままでもいいが広すぎるのでコメントコンポーネントだけに切り替える
        commentComponentObs.observe(commentComponentEl, {
          childList: true,
          subtree: true,
        });
        contentsBodyOceanObs.disconnect();
      }
    });
  
    const commentComponentObs = new MutationObserver((mutations) => {
      // コメントコンポーネントが書き換わったらここに入る
      mutations.forEach((mutation: MutationRecord) => {
        if (!(mutation.target instanceof Element)) {
          return;
        }
        const targetClassList = mutation.target.classList;
        if (
          targetClassList.contains("ocean-ui-comments-commentcomponent") ||
          targetClassList.contains("ocean-ui-comments-post-commentholder")
        ) {
          mutation.addedNodes.forEach((node) => {
            if (!(node instanceof Element)) {
              return;
            }
            handlers.forEach((handler) => handler(node as HTMLElement));
            Array.from(
              node.querySelectorAll(".ocean-ui-comments-commentbase-entity")
            ).forEach((childNode) => {
              handlers.forEach((handler) => handler(childNode as HTMLElement));
            });
          });
        }
      });
    });
  
    contentsBodyOceanObs.observe(contentsBodyOceanEl, {
      childList: true,
      subtree: true,
    });
  
    return commentComponentObs;
  };