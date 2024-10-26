const makePopup = () => {
  const popupEl = document.createElement('div');
  popupEl.className = 'krep-popup';
  popupEl.innerText = 'text';
  popupEl.style.position = 'absolute';
  popupEl.style.display = 'none';
  return popupEl;
}

const makeReplyLinkButton = (href: string) => {
  const aTag = document.createElement('a');

  aTag.href = href;
  aTag.innerHTML = "💬";
  // リッチエディタにclass名を付与して送信すると「user-token」のprefixが付くので
  // 送信後のclass名は「user-token-reply-link-button」になる
  aTag.className = "reply-link-button";
  return aTag;
}

const makeKrepActionEl_ = () => {
  const krepActionEl = document.createElement('li');

  const krepActionLinkEl = document.createElement('a');
  krepActionLinkEl.className = 'ocean-ui-comments-commentbase-krep';
  krepActionLinkEl.style.userSelect = 'none';
  krepActionLinkEl.innerHTML = "💬リンク付きで返信";

  krepActionEl.appendChild(krepActionLinkEl);
  return krepActionEl;
};

const makeReplyLinkAndAppendToRoot = (src: HTMLElement, editorSrc: HTMLElement, clickHandler: (src: HTMLElement, editorSrc: HTMLElement, href: string) => void) => {
  const actionsRoot = src.querySelector('.ocean-ui-comments-commentbase-actions') as HTMLElement;
  const krepActionEl = makeKrepActionEl_();

  const href = src.querySelector('.ocean-ui-comments-commentbase-time a')?.attributes.getNamedItem('href')?.value;
  krepActionEl.addEventListener("click", () => clickHandler(src, editorSrc, href!));
  if(!actionsRoot.querySelector('.ocean-ui-comments-commentbase-krep')) {
    actionsRoot.appendChild(krepActionEl);
  }
};

// コメントリンクから内容を取得する。取得出来なかった場合は、古いコメントを展開する旨のダイアログを表示
const getComment = (comment: string | undefined, parentPost: HTMLElement | undefined): string | null => {
  console.log({comment, parentPost})
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
  const aTag = makeReplyLinkButton(href);
  editorField.innerHTML = aTag.outerHTML + "<span>&nbsp;</span>" + (editorField.innerHTML === "<br>" ? "" : editorField.innerHTML);
};

export { makePopup, makeReplyLinkButton, makeReplyLinkAndAppendToRoot, getComment, getEditorField, addReplyLinkToEditorField }