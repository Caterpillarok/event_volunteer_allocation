import gsap from "gsap";
import throttle from "lodash.throttle";

const getAreaDetails = (area) => {
  const { width, height, top, left } = area.getBoundingClientRect();
  return {
    left,
    height,
    top: top + window.scrollY,
    width,
  };
};

const setTweenArea = (link, magicArea) => {
  const { left, height, top, width } = getAreaDetails(link);
  gsap.set(magicArea, { top, left, width, height });
};

const tweenMagicArea = (target, magicArea) => {
  const { left, height, top, width } = getAreaDetails(target);
  gsap.to(magicArea, {
    left,
    top,
    width,
    height,
    duration: 0.25,
    ease: "power3.inOut",
  });
};

const getMagicActiveElement = (links) =>
  links.filter(
    (link) =>
      link.classList.contains("is-magic-active") ||
      link.getAttribute("aria-current") === "page"
  );

export function initMagicAreas() {
  const magicAreas = [...document.querySelectorAll(".magic-area")];
  if (!magicAreas.length) return () => {};

  const listeners = [];

  const moveMagicArea = (links, magicArea, isTweenBack) => {
    const magicActiveElement = getMagicActiveElement(links);

    links.forEach((link) => {
      const onEnter = (e) => tweenMagicArea(e.currentTarget, magicArea);
      const onFocus = (e) => tweenMagicArea(e.currentTarget, magicArea);

      link.addEventListener("mouseenter", onEnter);
      link.addEventListener("focus", onFocus);
      listeners.push([link, "mouseenter", onEnter]);
      listeners.push([link, "focus", onFocus]);

      if (isTweenBack && magicActiveElement.length) {
        const onLeave = () => tweenMagicArea(magicActiveElement[0], magicArea);
        const onFocusOut = () => tweenMagicArea(magicActiveElement[0], magicArea);
        link.addEventListener("mouseleave", onLeave);
        link.addEventListener("focusout", onFocusOut);
        listeners.push([link, "mouseleave", onLeave]);
        listeners.push([link, "focusout", onFocusOut]);
      }
    });
  };

  const setMagic = (links, magicArea) => {
    const magicActiveElement = getMagicActiveElement(links);
    if (magicActiveElement.length) {
      setTweenArea(magicActiveElement[0], magicArea);
    } else {
      setTweenArea(links[0], magicArea);
    }
  };

  const initMagic = ({ isResize } = { isResize: false }) => {
    magicAreas.forEach((magicArea) => {
      const targetClass = magicArea.getAttribute("data-target-class");
      if (!targetClass) {
        magicArea.style.opacity = 0;
        return;
      }

      const links = [...document.querySelectorAll(targetClass)];
      if (!links.length) {
        magicArea.style.opacity = 0;
        return;
      }

      setMagic(links, magicArea);
      magicArea.style.opacity = 1;

      if (!isResize) {
        const isTweenBack = magicArea.getAttribute("data-tween-back") === "true";
        moveMagicArea(links, magicArea, isTweenBack);
      }
    });
  };

  initMagic();

  const onResize = throttle(() => initMagic({ isResize: true }), 100);
  window.addEventListener("resize", onResize);

  return () => {
    window.removeEventListener("resize", onResize);
    listeners.forEach(([el, event, handler]) =>
      el.removeEventListener(event, handler)
    );
  };
}
