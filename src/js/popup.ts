import { getComment } from "./element";

const popupSetup = (e: MouseEvent, content: string | null) => {
  const popupEl = document.querySelector('.krep-popup') as HTMLElement;
  popupEl.style.display = 'block';
  popupEl.style.left = (e.pageX - popupEl.clientWidth) > 0 ? (e.pageX - popupEl.clientWidth) + 'px' : '0px';
  popupEl.style.top = (e.pageY - popupEl.clientHeight * 1.2) + 'px';
  popupEl.innerHTML = content ?? '';
};

const handlePopupShow = (reply: HTMLElement, post: HTMLElement | undefined, linkToComment: { [key: string]: string }) => {
  reply.addEventListener("mouseover", (e: MouseEvent) => {
    const normalizedLink = normalizeLink((e.target as HTMLAnchorElement).href);
    console.log("linkToComment[normalizedLink]", linkToComment[normalizedLink]);
    console.log({ linkToComment }, { normalizedLink });
    const cachedComment = linkToComment[normalizedLink];
    if (post) {
      popupSetup(e, getComment(cachedComment, post));
    } else {
      popupSetup(e, getComment(cachedComment, undefined));
    }
  });
  reply.addEventListener("mouseout", () => {
    const popupEl = document.querySelector('.krep-popup') as HTMLElement;
    popupEl.style.display = 'none';
  });
};

const normalizeLink = (url: string) => {
  return url.replace(/^(https:\/\/\w+)\.s\./, '$1.');
}

export { popupSetup, handlePopupShow }