### [DOMSnapshot.NodeTreeSnapshot](https://chromedevtools.github.io/devtools-protocol/tot/DOMSnapshot/#type-NodeTreeSnapshot)

**parentIndex** *array[ integer ]*
* Indexes into **nodeName**

**nodeType** *array[ integer ]*
* Is just the Node's [*nodeType*](https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType)

**nodeName** *array[ StringIndex ]*
* Indexes into **DOMSnapshot['strings']**

**nodeValue** *array[ StringIndex ]*
* Indexes into **DOMSnapshot['strings']**
---
### [DOMSnapshot.LayoutTreeSnapshot](https://chromedevtools.github.io/devtools-protocol/tot/DOMSnapshot/#type-LayoutTreeSnapshot)

**nodeIndex** *array[ integer ]*
* Indexes into **nodeName**

**clientRects** *array[ Rectangle ]*
* Is the Node's clientRect properties
`[?,?,Width,Height]` *(We only need the last two. I'd guess the first two are horizonal start and vertical start.)*
---
**example:** Say I start at index `1` of the `nodeType` array. If it's a `ELEMENT_NODE` we can find the node's string by looking into `nodeName[1]` for the index number of the String in `DOMSnapshot['strings']`.

*(So `DOMSnapshot['strings'][nodeName[1]]`)*

If it's a `TEXT_NODE` we can find the tag of it's parent by looking into `parentIndex` for the index into the `nodeName` which will have the index for `DOMSnapshot['strings']`.

*(So `DOMSnapshot['strings'][[nodeName[parentIndex[1]]]`)*

If we need to find it's parent's *ClientRect* property we actually have to match up the index contained in `parentIndex` to the one contained in `nodeIndex`.

One way to do it is to create a extra array by looping through the `nodeIndex` putting the node's ClientRect value in the corresponding index we get from `nodeIndex`.

*Ex: `extraArray[nodeIndex[itr]] = clientRects[itr]`*

Then you simply access it via the `parentIndex` like you do for the the tag name.

*eg. `extraArray[parentIndex[1]]`*