import{r as x}from"./vendor.b8d440aa.js";var n={exports:{}},t={};/** @license React v17.0.2
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var l=x.exports,_=60103;t.Fragment=60107;if(typeof Symbol=="function"&&Symbol.for){var i=Symbol.for;_=i("react.element"),t.Fragment=i("react.fragment")}var u=l.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,y=Object.prototype.hasOwnProperty,c={key:!0,ref:!0,__self:!0,__source:!0};function m(o,r,f){var e,s={},p=null,a=null;f!==void 0&&(p=""+f),r.key!==void 0&&(p=""+r.key),r.ref!==void 0&&(a=r.ref);for(e in r)y.call(r,e)&&!c.hasOwnProperty(e)&&(s[e]=r[e]);if(o&&o.defaultProps)for(e in r=o.defaultProps,r)s[e]===void 0&&(s[e]=r[e]);return{$$typeof:_,type:o,key:p,ref:a,props:s,_owner:u.current}}t.jsx=m;t.jsxs=m;n.exports=t;const d=n.exports.jsx,j=n.exports.jsxs,O=n.exports.Fragment;export{O as F,d as a,j};
