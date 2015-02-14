define(["exports", "../dom", "../array", "../string", "../sort", "../event"], function (exports, _dom, _array, _string, _sort, _event) {
  "use strict";

  var _classProps = function (child, staticProps, instanceProps) {
    if (staticProps) Object.defineProperties(child, staticProps);
    if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
  };

  var Dom = _dom.Dom;
  var array = _array.Arr;
  var Str = _string.Str;
  var Sort = _sort.Sort;
  var Event = _event.Event;
  var Dropdown = (function () {
    var Dropdown = function Dropdown(tf) {
      // Configuration object
      var f = tf.fObj;

      this.enableSlcResetFilter = !f.enable_slc_reset_filter ? false : true;
      //defines empty option text
      this.nonEmptyText = f.non_empty_text || "(Non empty)";
      //enables/disables onChange event on combo-box
      this.onSlcChange = f.on_change === false ? false : true;
      //sets select filling method: 'innerHTML' or 'createElement'
      this.slcFillingMethod = f.slc_filling_method || "createElement";
      //IE only, tooltip text appearing on select before it is populated
      this.activateSlcTooltip = f.activate_slc_tooltip || "Click to activate";
      //tooltip text appearing on multiple select
      this.multipleSlcTooltip = f.multiple_slc_tooltip || "Use Ctrl key for multiple selections";
      this.hasCustomSlcOptions = types.isObj(f.custom_slc_options) ? true : false;
      this.customSlcOptions = types.isArray(f.custom_slc_options) ? f.custom_slc_options : null;

      this.isCustom = null;
      this.opts = [];
      this.optsTxt = [];
      this.slcInnerHtml = "";

      this.tf = tf;
    };

    _classProps(Dropdown, null, {
      _build: {
        writable: true,
        value: function (colIndex, isRefreshed, isExternal, extFltId) {
          if (extFltId === undefined) extFltId = null;
          if (isExternal === undefined) isExternal = false;
          if (isRefreshed === undefined) isRefreshed = false;
          var tf = this.tf;
          colIndex = parseInt(colIndex, 10);

          var slcId = tf.fltIds[colIndex];
          if ((!Dom.id(slcId) && !isExternal) || (!Dom.id(extSlcId) && isExternal)) {
            return;
          }
          var slc = !isExternal ? Dom.id(slcId) : Dom.id(extSlcId), rows = tf.tbl.rows, matchCase = tf.matchCase, fillMethod = Str.lower(this.slcFillingMethod);

          //custom select test
          this.isCustom = (this.hasCustomSlcOptions && array.has(this.customSlcOptions.cols, colIndex));

          //custom selects text
          var activeFlt;
          if (isRefreshed && tf.activeFilterId) {
            activeFlt = tf.activeFilterId.split("_")[0];
            activeFlt = activeFlt.split(tf.prfxFlt)[1];
          }

          /*** remember grid values ***/
          var flts_values = [], fltArr = [];
          if (tf.rememberGridValues) {
            flts_values = tf.Cpt.store.getFilterValues(tf.fltsValuesCookie);
            if (flts_values && !Str.isEmpty(flts_values.toString())) {
              if (this.isCustom) {
                fltArr.push(flts_values[colIndex]);
              } else {
                fltArr = flts_values[colIndex].split(" " + tf.orOperator + " ");
              }
            }
          }

          var excludedOpts = null, filteredDataCol = null;
          if (isRefreshed && tf.disableExcludedOptions) {
            excludedOpts = [];
            filteredDataCol = [];
          }

          for (var k = tf.refRow; k < tf.nbRows; k++) {
            // always visible rows don't need to appear on selects as always
            // valid
            if (tf.hasVisibleRows && array.has(tf.visibleRows, k) && !tf.paging) {
              continue;
            }

            var cell = rows[k].cells, nchilds = cell.length;

            // checks if row has exact cell #
            if (nchilds !== tf.nbCells || this.isCustom) {
              continue;
            }
            // checks if row has exact cell #
            // if(nchilds === this.nbCells && !this.isCustom){
            // this loop retrieves cell data
            for (var j = 0; j < nchilds; j++) {
              if ((colIndex === j && (!isRefreshed || (isRefreshed && tf.disableExcludedOptions))) || (colIndex == j && isRefreshed && ((rows[k].style.display === "" && !tf.paging) || (tf.paging && (!tf.validRowsIndex || (tf.validRowsIndex && array.has(tf.validRowsIndex, k))) && ((activeFlt === undefined || activeFlt == colIndex) || (activeFlt != colIndex && array.has(tf.validRowsIndex, k))))))) {
                var cell_data = this.GetCellData(j, cell[j]),
                //Vary Peter's patch
                cell_string = Str.matchCase(cell_data, matchCase);

                // checks if celldata is already in array
                if (!array.has(this.opts, cell_string, matchCase)) {
                  this.opts.push(cell_data);
                }

                if (isRefreshed && tf.disableExcludedOptions) {
                  var filteredCol = filteredDataCol[j];
                  if (!filteredCol) {
                    filteredCol = this.GetFilteredDataCol(j);
                  }
                  if (!array.has(filteredCol, cell_string, matchCase) && !array.has(excludedOpts, cell_string, matchCase) && !this.isFirstLoad) {
                    excludedOpts.push(cell_data);
                  }
                }
              } //if colIndex==j
            } //for j
            // }//if
          } //for k

          //Retrieves custom values
          if (this.isCustom) {
            var customValues = tf.__getCustomValues(colIndex);
            this.opts = customValues[0];
            this.optsTxt = customValues[1];
          }

          if (tf.sortSlc && !this.isCustom) {
            if (!matchCase) {
              this.opts.sort(Sort.ignoreCase);
              if (excludedOpts) {
                excludedOpts.sort(Sort.ignoreCase);
              }
            } else {
              this.opts.sort();
              if (excludedOpts) {
                excludedOpts.sort();
              }
            }
          }

          //asc sort
          if (tf.sortNumAsc && array.has(tf.sortNumAsc, colIndex)) {
            try {
              this.opts.sort(numSortAsc);
              if (excludedOpts) {
                excludedOpts.sort(numSortAsc);
              }
              if (this.isCustom) {
                this.optsTxt.sort(numSortAsc);
              }
            } catch (e) {
              this.opts.sort();
              if (excludedOpts) {
                excludedOpts.sort();
              }
              if (this.isCustom) {
                this.optsTxt.sort();
              }
            } //in case there are alphanumeric values
          }
          //desc sort
          if (tf.sortNumDesc && array.has(tf.sortNumDesc, colIndex)) {
            try {
              this.opts.sort(numSortDesc);
              if (excludedOpts) {
                excludedOpts.sort(numSortDesc);
              }
              if (this.isCustom) {
                this.optsTxt.sort(numSortDesc);
              }
            } catch (e) {
              this.opts.sort();
              if (excludedOpts) {
                excludedOpts.sort();
              }
              if (this.isCustom) {
                this.optsTxt.sort();
              }
            } //in case there are alphanumeric values
          }

          //populates drop-down
          this.addOptions(colIndex, slc, excludedOpts, fltArr);
        }
      },
      addOptions: {
        writable: true,
        value: function (colIndex, slc, excludedOpts, fltArr) {
          var tf = this.tf, fillMethod = Str.lower(this.slcFillingMethod), slcValue = slc.value;

          slc.innerHTML = "";
          slc = this.addFirstOption(slc);

          for (var y = 0; y < this.opts.length; y++) {
            if (this.opts[y] === "") {
              continue;
            }
            var val = this.opts[y]; //option value
            var lbl = this.isCustom ? this.optsTxt[y] : val; //option text
            var isDisabled = false;
            if (isRefreshed && this.disableExcludedOptions && array.has(excludedOpts, Str.matchCase(val, tf.matchCase), tf.matchCase)) {
              isDisabled = true;
            }

            if (fillMethod === "innerhtml") {
              var slcAttr = "";
              if (tf.fillSlcOnDemand && slcValue === this.opts[y]) {
                slcAttr = "selected=\"selected\"";
              }
              this.slcInnerHtml += "<option value=\"" + val + "\" " + slcAttr + (isDisabled ? "disabled=\"disabled\"" : "") + ">" + lbl + "</option>";
            } else {
              var opt;
              //fill select on demand
              if (tf.fillSlcOnDemand && slcValue === this.opts[y] && tf["col" + colIndex] === tf.fltTypeSlc) {
                opt = Dom.createOpt(lbl, val, true);
              } else {
                if (tf["col" + colIndex] !== tf.fltTypeMulti) {
                  opt = Dom.createOpt(lbl, val, (flts_values[colIndex] !== " " && val === flts_values[colIndex]) ? true : false);
                } else {
                  opt = Dom.createOpt(lbl, val, (array.has(fltArr, Str.matchCase(this.opts[y], tf.matchCase), tf.matchCase) || fltArr.toString().indexOf(val) !== -1) ? true : false);
                }
              }
              if (isDisabled) {
                opt.disabled = true;
              }
              slc.appendChild(opt);
            }
          } // for y

          if (fillMethod === "innerhtml") {
            slc.innerHTML += this.slcInnerHtml;
          }
          slc.setAttribute("filled", "1");
        }
      },
      addFirstOption: {
        writable: true,
        value: function (slc) {
          var tf = this.tf, fillMethod = Str.lower(this.slcFillingMethod);

          if (fillMethod === "innerhtml") {
            this.slcInnerHtml += "<option value=\"\">" + tf.displayAllText + "</option>";
          } else {
            var opt0 = Dom.createOpt((!this.enableSlcResetFilter ? "" : tf.displayAllText), "");
            if (!this.enableSlcResetFilter) {
              opt0.style.display = "none";
            }
            slc.appendChild(opt0);
            if (tf.enableEmptyOption) {
              var opt1 = Dom.createOpt(tf.emptyText, tf.emOperator);
              slc.appendChild(opt1);
            }
            if (tf.enableNonEmptyOption) {
              var opt2 = Dom.createOpt(tf.nonEmptyText, tf.nmOperator);
              slc.appendChild(opt2);
            }
          }
          return slc;
        }
      }
    });

    return Dropdown;
  })();

  exports.Dropdown = Dropdown;
});