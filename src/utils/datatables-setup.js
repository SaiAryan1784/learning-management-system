import $ from "jquery";
import "datatables.net";

$.extend($.fn.dataTable.defaults, {
  layout: {
    topStart: "search",
    topEnd: "pageLength",
    bottomStart: "info",
    bottomEnd: "paging",
  },
});
