export {};
import '../css/contentScript.scss';
import { moveCursorToEnd } from './cursor';
import { makeReplyLinkAndAppendToRoot, makePopup, getEditorField, addReplyLinkToEditorField } from "./element";
import { addHandlersToComment } from './observer';
import { handlePopupShow } from './popup';
import { enableUrl } from './url';

let observer: MutationObserver | null;

(() => {
  // 投稿日時からコメントの内容を取得するためのオブジェクト
  const linkToComment: {[key: string]: string} = {};

  const cacheContent = (src: Element) => {
    const replyUser = (src.querySelector('.ocean-ui-comments-commentbase-name') as HTMLElement)?.innerText;
    const replyUserIcon = src.querySelector('.ocean-ui-comments-commentbase-usericon') as HTMLElement;
    const content = src.querySelector('.ocean-ui-comments-commentbase-contents')?.innerHTML;
    // ポップアップで送信者アイコン、送信者名、コメント内容を表示する
    const href = src.querySelector('.ocean-ui-comments-commentbase-time a')?.attributes.getNamedItem('href')?.value;
    if (href) {
      linkToComment[href] = replyUserIcon.outerHTML + replyUser + content;
    }
  }

  // Popup要素をbodyに追加
  document.body.appendChild(makePopup());

  const onClickHandler = (src: HTMLElement, editorSrc: HTMLElement, href: string) => {
    const reply = src.querySelector('.ocean-ui-comments-commentbase-comment') as HTMLElement;
    reply.click();
    getEditorField(editorSrc).then(([document, editorField]) => {
      if (href) {
        addReplyLinkToEditorField(href, editorField);
      }
      moveCursorToEnd(document, editorField);
    });
  }

  const setupReplyLink_ = (commentEl: HTMLElement) => {
    const closestPostEl = commentEl.closest('.ocean-ui-comments-post');
    if (!closestPostEl) {
      throw new Error("unexpected error");
    }
    makeReplyLinkAndAppendToRoot(commentEl, closestPostEl as HTMLElement, onClickHandler);
    cacheContent(commentEl);
    const krepReplyButtonEl = commentEl.querySelector('.user-token-reply-link-button') as HTMLElement;
    if(krepReplyButtonEl) {
      handlePopupShow(krepReplyButtonEl, closestPostEl as HTMLElement, linkToComment);
    }
  }
  
  window.addEventListener("hashchange", () => {
    // シングルページだと設定を見ずに無条件でobserverを1回切ったほうが良さそう
    observer?.disconnect();
    window.dispatchEvent(
      new CustomEvent("krep::urlChange", { detail: {} })
    );
  });

  addHandlersToComment([setupReplyLink_]); // ページ再読み込みのときに上手く付与できないためEventListenerの外で1回実行する
  
  window.addEventListener("krep::urlEnableFetched", () => {
    observer = addHandlersToComment([setupReplyLink_]);
  });

  window.addEventListener("krep::urlChange", () => {
    if (enableUrl(location.href)) {
      window.dispatchEvent(
        new CustomEvent("krep::urlEnableFetched")
      );
    }
  });
})();
