export function onElementLoaded(elementToObserve, parentStaticElement) {
  const promise = new Promise((resolve, reject) => {
    try {
      if (document.querySelector(elementToObserve)) {
        resolve(document.querySelector(elementToObserve));
        return;
      }

      const parentElement = document.querySelector(parentStaticElement);

      const observer = new MutationObserver((mutationList, observer) => {
        const divToCheck = document.querySelector(elementToObserve);
        if (divToCheck) {
          observer.disconnect();
          resolve(divToCheck);
        }
      });

      observer.observe(parentElement, {
        childList: true,
        subtree: true,
      });
    } catch (e) {
      console.log(e);
      reject(Error("some issue... promise rejected"));
    }
  });
  return promise;
}
