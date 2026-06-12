import $ from "jquery";
import "datatables.net";

$.extend($.fn.dataTable.defaults, {
  layout: {
    topStart: "search",
    topEnd: "length",
    bottomStart: "info",
    bottomEnd: "paging",
  },
});
