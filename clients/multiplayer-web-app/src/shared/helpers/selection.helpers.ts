const getFirstTextNode = (el) => {
  if (!el) return null;
  if (el.nodeType === 3) return el;

  for (let child of el.childNodes) {
    if (child.nodeType === 3) {
      return child;
    } else {
      let textNode = getFirstTextNode(child);
      if (textNode !== null) return textNode;
    }
  }

  return null;
};

const walkRange = (range): Range[] => {
  let ranges: Range[] = [];

  let el = range.startContainer;
  let elsToVisit = true;
  while (elsToVisit) {
    let startOffset = el === range.startContainer ? range.startOffset : 0;
    let endOffset =
      el === range.endContainer ? range.endOffset : el.textContent.length;
    let r = document.createRange();
    r.setStart(el, startOffset);
    r.setEnd(el, endOffset);
    ranges.push(r);

    /// Move to the next text container in the tree order
    elsToVisit = false;
    while (!elsToVisit && el !== range.endContainer) {
      let nextEl = getFirstTextNode(el.nextSibling);
      if (nextEl) {
        el = nextEl;
        elsToVisit = true;
      } else {
        if (el.nextSibling) el = el.nextSibling;
        else if (el.parentNode) el = el.parentNode;
        else break;
      }
    }
  }

  return ranges;
};

export const highlightSelection = (selection: Selection, selector:string, id: string) => {
  const range = selection.getRangeAt ? selection.getRangeAt(0) : selection;
  for (let r of walkRange(range)) {
    let mark = document.createElement("span");
    mark.setAttribute('data-comment', id);
    mark.style.backgroundColor = "red";
    r.surroundContents(mark);
  }
};

export const unHighlightSelection = (sel) => {
  document
    .querySelectorAll(sel)
    .forEach((el) => el.replaceWith(...el.childNodes));
};

export const isSelectionContainingElement = (
  selection: Selection,
  selector: string
): boolean => {
  const range = selection.getRangeAt(0); // Assuming there is at least one range in the selection
  const elements = document.querySelectorAll(selector);
  for (let i = 0; i < elements.length; i++) {
    if (range.intersectsNode(elements[i])) {
      return true;
    }
  }
  return false;
};


// export const highlightSelection = (
//   selection: Selection,
//   selector: string,
//   id: string
// ) => {
//   const range = selection.getRangeAt ? selection.getRangeAt(0) : selection;
//   console.log(selection.anchorNode);
//   console.log(selection);

//   const container = document.querySelector(".editor-wrapper");
//   const cRect = container.getBoundingClientRect();


//   for (let r of walkRange(range)) {
//     console.log(r);

//     const domRects = r.getClientRects();

//     for (let rect of domRects) {
//       let mark = document.createElement("span");

//       mark.style.opacity = "0.3";
//       mark.style.backgroundColor = "red";
//       mark.style.position = "absolute";
//       mark.style.top = rect.y - 2 - cRect.y + "px";
//       mark.style.left = rect.x - cRect.x + "px";
//       mark.style.width = rect.width + "px";
//       mark.style.height = rect.height + 4 + "px";

//       container.appendChild(mark);
//       document.getSelection().removeAllRanges();
//       // r.surroundContents(mark);
//     }
//   }
// };