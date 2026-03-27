sap.ui.define([],
	function () {
		return {
			formatCommentColour: function (sValue) {
				if (!sValue) {
					//return "#1B7CD1";
					return "#26cc23";
				} else {
					//	return "#1E6E33";
					return "#ed2a1c";
				}
			},

			formatDate: function (date) {
				if (date && date.indexOf("/Date") !== -1) {
					var oDateFormat = sap.ui.core.format.DateFormat.getInstance({
						pattern: "dd/MM/yyyy"
					});
					date = oDateFormat.format(new Date(parseFloat(date.split("(")[1].split(")")[0])));
					return date;
				} else {
					return date;
				}
			},

			checkEditOption: function (code, group) {
				// var cDate = new Date();
				// if (code && new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDay()) >= new Date(cDate.getFullYear(), cDate.getMonth(), cDate.getDay())) {
				// 	return code.toString().startsWith('2') ? true : false;
				// }
				if (code && group === "MATRIX_ADMIN") {
					return code.toString().startsWith('2') ? true : false;
				} else {
					return false;
				}
			},

			formatRowElement: function (rowElement) {
				var tempEntry = {};
				for (var key in rowElement) {
					if (rowElement.hasOwnProperty(key)) {
						tempEntry[this.removeUnwantedChars(key)] = (rowElement[key]) ? rowElement[key] : "";
					}
				}
				return tempEntry;
			},
			/**
			 * Remove Unwanted Characters from an attribute
			 */
			removeUnwantedChars: function (attr) {
				attr = (attr) ? attr : "";
				attr = attr.replace(" ", "").replace("\r", "").replace("\n", "").replace(/(<([^>]+)>)/ig, "").replace("&nbsp;", "");
				while (attr.indexOf(" ") > -1 || attr.indexOf("\r") > -1 || attr.indexOf("\n") > -1 ||
					attr.indexOf("-") > -1 || attr.indexOf(".") > -1 || attr.indexOf("/") > -1 || attr.indexOf("(") > -1 || attr.indexOf("%") > -1 ||
					attr.indexOf(")") > -1) {
					attr = attr.replace(" ", "").replace("\r", "").replace("\n", "").replace("-", "").replace(".", "").replace("/", "").replace("(",
						"").replace("%", "").replace(")", "");
				}

				return attr;
			},
			validateDataInModels: function (model, data) {
				var obj = (model) ? model.getData() : data;
				var isLoaded = (obj && Object.keys(obj).length > 0) ? true : false;
				return isLoaded;
			},
			/***
			 * Extract and Frame Task Context Data
			 */
			hexToBase64: function (str) {
				return btoa(String.fromCharCode.apply(null, str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(
					" ")));
			},
			_formatDesignationList: function (oData) {
				var designationList = [];
				var designationMap = {};
				// var configValue = (oData.results instanceof Array && oData.results.length > 0) ? oData.results[0].CONFIG_VALUE : "";
				// var splitConfig = (configValue) ? configValue.split(",") : [];
				var tempVal = "";
				jQuery.sap.each(oData.results, function (i, designationElement) {
					if (!designationMap[designationElement.CONFIG_VALUE]) {
						designationMap[designationElement.CONFIG_VALUE] = designationElement.CONFIG_VALUE;
						tempVal = designationMap[designationElement.CONFIG_VALUE];
						designationList.push({
							"DESIGNATION_CODE": tempVal.substring(0, tempVal.indexOf("(")),
							"DESIGNATION_DESC": tempVal.substring(tempVal.indexOf("(") + 1, tempVal.indexOf(")"))
						});
					}

				});
				return designationList;
			},
			_formatDataPerConfigurationDialog: function (oData) {
				oData.VALID_FROM = this.formatDateAsString(oData.VALID_FROM, "yyyy-MM-dd");
				oData.VALID_TO = this.formatDateAsString(oData.VALID_TO, "yyyy-MM-dd");
				oData.ALL_FDLU = Boolean(oData.FDLU && oData.FDLU === "ALL");
				oData.FDLU_T = oData.ALL_FDLU ? oData.FDLU : oData.FDLU_T;
				oData.ALL_ULU = Boolean(oData.ULU && oData.ULU === "ALL");
				oData.ULU_T = oData.ALL_ULU ? oData.ULU : oData.ULU_T;
				oData.PROCESS_CODE = oData.CLAIM_TYPE;
			},
			_formatUluFdlu: function (component, selectedUlu, selectedProcessCode) {
				// aRows = this._parseJsonData(aRows);
				var authMatrix = component.AppModel.getProperty("/staffInfo/authMatrix");
				var uluFdluList = [];
				jQuery.sap.each(authMatrix, function (a, row) {
					row.ULU_C = row.ULU;
					row.FDLU_C = row.FDLU;
					if (selectedProcessCode === row.PROCESS_CODE)
						uluFdluList.push(row);
				});
				return uluFdluList;
			},
			_checkIfFDLURequired: function (component, selectedUlu) {
				var authMatrix = component.AppModel.getProperty("/staffInfo/authMatrix");
				var isFdluRequired = false;
				jQuery.sap.each(authMatrix, function (a, row) {
					if (row.ULU_C === selectedUlu && !isFdluRequired && row.FDLU_C === component.getI18n("FDLU_ALL")) {
						isFdluRequired = true;
					}
				});

				return isFdluRequired;
			},
			_formatForExportMassUploadRow: function (oData) {
				oData.VALID_FROM_DISPLAY = this.formatDateAsString(oData.VALID_FROM, "dd.MM.yyyy");
				oData.VALID_TO_DISPLAY = this.formatDateAsString(oData.VALID_TO, "dd.MM.yyyy");
				oData.UPDATED_ON_DISPLAY = this.formatDateAsString(oData.UPDATED_ON, "dd/MM/yyyy hh:MM:ss");
			},
			/**
			 * Parse Object
			 */
			_parseJsonData: function (data) {
				if (data) {
					data = JSON.parse(JSON.stringify(data));
				}
				return data;
			},
			changeTheValidityDisplayFormat: function (oModel, tempDate) {
				console.log(tempDate);
				return tempDate;
			},
			/*
			 * Format Date as String
			 */
			formatDateAsString: function (dateValue, format, isYearFormat, localData) {
				var response = "";
				if (dateValue && dateValue !== "NA" && dateValue !== "/Date(0)/") {
					if (dateValue) {
						if (typeof (dateValue) === "string" && dateValue.indexOf("/Date") > -1) {
							dateValue = parseFloat(dateValue.substr(dateValue.lastIndexOf("(") + 1, dateValue.lastIndexOf(")") - 1));
						}
						dateValue = new Date(dateValue);
					}
					/*else {
						dateValue = new Date();
					}*/
					if (dateValue) {

						var yyyy = dateValue.getFullYear() + "";
						var tempDateStr = new Date().getFullYear();
						if (isYearFormat && isYearFormat != 'false' && (parseInt(yyyy) < tempDateStr)) {
							yyyy = tempDateStr.toString().substring(0, 2) + yyyy.substring(2, yyyy.length);
						}
						var mm = (dateValue.getMonth() + 1) + "";
						mm = (mm.length > 1) ? mm : "0" + mm;
						var dd = dateValue.getDate() + "";
						dd = (dd.length > 1) ? dd : "0" + dd;

						var hh, mins, secs;

						switch (format) {
						case "yyyyMMdd":
							response = yyyy + mm + dd;
							break;
						case "dd/MM/yyyy":
							response = dd + "/" + mm + "/" + yyyy;
							break;
						case "dd.MM.yyyy":
							response = dd + "." + mm + "." + yyyy;
							break;
						case "yyyy-MM-dd":
							response = yyyy + "-" + mm + "-" + dd;
							break;
						case "yyyy-dd-MM":
							response = yyyy + "-" + dd + "-" + mm;
							break;
						case "MM/dd/yyyy":
							response = mm + "/" + dd + "/" + yyyy;
							break;
						case "MM/yyyy":
							response = mm + "/" + yyyy;
							break;
						case "yyyy-MM-ddThh:MM:ss":
							hh = dateValue.getHours() + "";
							hh = (hh.length > 1) ? hh : "0" + hh;
							mins = dateValue.getMinutes() + "";
							mins = (mins.length > 1) ? mins : "0" + mins;
							secs = dateValue.getSeconds() + "";
							secs = (secs.length > 1) ? secs : "0" + secs;
							response = yyyy + "-" + mm + "-" + dd + "T" + hh + ":" + mins + ":" + secs;
							break;
						case "yyyy-MM-dd hh:MM:ss":
							hh = dateValue.getHours() + "";
							hh = (hh.length > 1) ? hh : "0" + hh;
							mins = dateValue.getMinutes() + "";
							mins = (mins.length > 1) ? mins : "0" + mins;
							secs = dateValue.getSeconds() + "";
							secs = (secs.length > 1) ? secs : "0" + secs;
							response = yyyy + "-" + mm + "-" + dd + " " + hh + ":" + mins + ":" + secs;
							break;
						case "hh:MM:ss":
							hh = dateValue.getHours() + "";
							hh = (hh.length > 1) ? hh : "0" + hh;
							mins = dateValue.getMinutes() + "";
							mins = (mins.length > 1) ? mins : "0" + mins;
							secs = dateValue.getSeconds() + "";
							secs = (secs.length > 1) ? secs : "0" + secs;
							response = hh + ":" + mins + ":" + secs;
							break;
						case "dd/MM/yyyy hh:MM:ss":
							response = dd + "/" + mm + "/" + yyyy + " ";
							hh = dateValue.getHours() + "";
							hh = (hh.length > 1) ? hh : "0" + hh;
							mins = dateValue.getMinutes() + "";
							mins = (mins.length > 1) ? mins : "0" + mins;
							secs = dateValue.getSeconds() + "";
							secs = (secs.length > 1) ? secs : "0" + secs;
							response += hh + ":" + mins + ":" + secs;
							break;
						case "dd/MM/yyyy hh:MM:ss aa":
							response = mm + "/" + dd + "/" + yyyy + " ";
							hh = dateValue.getHours();
							var ampm = (hh >= 12) ? 'PM' : 'AM';
							hh = hh % 12;
							hh = (hh ? (hh < 10 ? "0" + hh : hh) : 12);
							// hh = (hh.length > 1) ? hh : "0" + hh;
							mins = dateValue.getMinutes() + "";
							mins = (mins.length > 1) ? mins : "0" + mins;
							secs = dateValue.getSeconds() + "";
							secs = (secs.length > 1) ? secs : "0" + secs;
							response += hh + ":" + mins + ":" + secs + " " + ampm;
							break;
						case "dd Mmm,yyyy":
							response = mm + "/" + dd + "/" + yyyy + " ";
							mm = localData[Number(mm) - 1].substring(0, 3);
							hh = dateValue.getHours();
							var ampm = (hh >= 12) ? 'PM' : 'AM';
							hh = hh % 12;
							hh = (hh ? (hh < 10 ? "0" + hh : hh) : 12);
							// hh = (hh.length > 1) ? hh : "0" + hh;
							mins = dateValue.getMinutes() + "";
							mins = (mins.length > 1) ? mins : "0" + mins;
							secs = dateValue.getSeconds() + "";
							secs = (secs.length > 1) ? secs : "0" + secs;
							response = dd + " " + mm + "," + yyyy;
							break;
						default:
							response = dateValue;
							break;
						}
					}
				}
				return response;
				//Format Year
			},

			// following function returns true if dateValue is in future else false
			_isFutureDate: function (dateValue) {
				if (dateValue) {
					if (this._getDiffWithCurrentTime(dateValue) > 0 && !this._isCurrentDate(
							dateValue)) {
						return true;
					}
				}
				return false;
			},
			// Compare two Date Values and return
			compareDates: function (date1, date2) {
				date1 = new Date(date1);
				date2 = new Date(date2);
				return (date1.getTime() === date2.getTime());
			},
			isEnabledForChange: function (dateAttr) {
				var currentDate = new Date();
				currentDate.setHours(0, 0, 0, 0);
				var vDate = new Date(dateAttr);
				vDate.setHours(0, 0, 0, 0);
				var diff = vDate.getTime() - (currentDate.getTime());
				return (diff > 0) ? true : false;
			},
			checkValidityForDelemition: function (validFrom, validTo, isShowAssignmentVisible) {
				var currentDate = new Date();
				currentDate.setHours(0, 0, 0, 0);
				var isVisible = false;
				if (validFrom && validTo) {
					var vFromDate = new Date(validFrom);
					var vToDate = new Date(validTo);
					isVisible = ((currentDate > vFromDate && currentDate < vToDate) || (vFromDate > currentDate && vToDate > currentDate)) ? true :
						isVisible;
				}
				return isVisible && isShowAssignmentVisible;
			},
			// following function returns difference in milliseconds between dateValue and current date
			_getDiffWithCurrentTime: function (dateValue) {
				var today = new Date();
				var deadline = new Date(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate(), 24, 00, 00);
				var diff = deadline.getTime() - (today.getTime());
				return diff;
			},
			_isCurrentDate: function (dateValue) {
				if (dateValue) {
					var oCurrentDate = new Date();
					if ((oCurrentDate.getDate() == dateValue.getDate()) && (oCurrentDate.getMonth() == dateValue.getMonth()) && (oCurrentDate.getYear() ==
							dateValue.getYear())) {
						return true;
					}
				}
			},

			parseObjectData: function (data) {
				if (data) {
					data = JSON.parse(JSON.stringify(data));
				}
				return data;
			},
			assignPropertiesToObjects: function (targetObj, sourceObj, isParse) {
				Object.assign(targetObj, sourceObj);
				return (isParse) ? this.parseObjectData(targetObj) : targetObj;
			},
			/**
			 * Calculate Hours based on Entered Start and End Time
			 */
			calculateHours: function (startTime, endTime) {
				var calculatedValue = "";
				if (startTime && endTime) {
					var start = startTime.split(":");
					var end = endTime.split(":");
					var startDate = new Date(0, 0, 0, start[0], start[1], 0);
					var endDate = new Date(0, 0, 0, end[0], end[1], 0);
					var diff = endDate.getTime() - startDate.getTime();
					var hours = Math.floor(diff / 1000 / 60 / 60);
					diff -= hours * 1000 * 60 * 60;
					// var minutes = Math.floor(diff / 1000 / 60);
					var minutes = (Math.abs(diff) / 36e5) * 100;
					//trying to restrict decimal places to 2

					var aMinutesDecPlaces = minutes.toString().split(".");

					if (aMinutesDecPlaces.length > 1) {
						//minutes = minutes.toFixed(1);
						minutes = parseFloat(minutes).toFixed(0);
					}

					calculatedValue = hours + "." + minutes;
				}
				return calculatedValue;
			},

			removeLeadingZeroes: function (tempVal) {
				tempVal = (tempVal) ? tempVal + "" : "";
				tempVal = (tempVal) ? tempVal.replace(/^0+/, '') : tempVal;
				return tempVal;
			},
			convertToString: function (tempVal) {
				tempVal = (tempVal) ? (tempVal + "").trim() : "";
				return tempVal;
			},
			paddingWithLeadingZeroes: function (num, size) {
				var s = num + "";
				while (s.length < size) s = "0" + s;
				return s;
			},
			/**
			 * Formatter Method to fix the Decimal Places
			 */
			toFixed: function (num, fixed, isGstAmt) {
				fixed = fixed || 0;
				fixed = Math.pow(100, fixed);
				var value = Math.floor(num * fixed) / fixed;
				return isGstAmt ? (value + "") : (Number(value).toFixed(2));
			},
			getLastDay: function (y, m) {
				return new Date(y, m + 1, 0).getDate();
			},
			getColorScheme: function (statusCode) {
				return (statusCode === '01') ? true : false;
			},
			getDaysDiff: function (date1, date2) {
				date1 = new Date(date1);
				date2 = new Date(date2);
				return Math.floor((date2 - date1) / (1000 * 60 * 60 * 24));
			},
			_amendHeaderToken: function (component, serviceToken) {
				var token = (serviceToken) ? serviceToken : component.AppModel.getProperty("/token");
				var oHeaders = {
					"Accept": "application/json",
					"Authorization": "Bearer" + " " + token,
					"AccessPoint": "A",
					"Content-Type": "application/json"
				};
				return oHeaders;
			}
		};
	});