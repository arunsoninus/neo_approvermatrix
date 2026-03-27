sap.ui.define([
	"../controller/BaseController", "../utils/configuration",
	"../utils/services", "sap/ui/core/Fragment", "../utils/dataformatter",
	"../utils/utility", "sap/ui/model/Filter", "../extensions/extendedvaluehelp",
	"../utils/massuploadhelper", "../utils/validation", "sap/m/Dialog", "sap/m/MessageBox", "sap/m/MessageToast",
	"sap/ui/export/Spreadsheet", 'sap/ui/export/library', "sap/ui/model/Sorter"
], function (BaseController, Config, Services, Fragment, Formatter, Utility, Filter, ExtendedValueHelp, MassUploadHelper, Validation,
	Dialog, MessageBox, MessageToast, Spreadsheet, exportLibrary, Sorter) {
	"use strict";
	return BaseController.extend("nus.edu.sg.approvermatrix.controller.MatrixMaintenance", {
		formatter: Formatter,
		onInit: function () {
			this.initialLoad();
		},

		initialLoad: function () {
			this.initializeModel();
			this.generateTokenForLoggedInUser();
			var appMatrixTable = this.getView().byId("idApproverMatrixTable");
			this.oTemplate = appMatrixTable.getBindingInfo("items").template;
			appMatrixTable.unbindAggregation("items");

		},

		initializeModel: function () {
			var oAppModel = this.setComponentModel("AppModel");
			this.AppModel = oAppModel;
			this.AppModel.setProperty("/searchUserType", "ALL");
			this.AppModel.setProperty("/showAssignNewButton", false);
		},
		/**
		 * Generate Token for Logged In User
		 */
		generateTokenForLoggedInUser: function () {
			Services.fetchLoggedUserToken(this, function (oRetData) {
				Utility._assignTokenAndUserInfo(oRetData, this);
				this.getApproverMatrixDetails(oRetData);
			}.bind(this));
		},
		getApproverMatrixDetails: function () {
			var serviceName = Config.dbOperations.metadataClaims;
			var oHeaders = Formatter._amendHeaderToken(this);
			var oDataModel = new sap.ui.model.odata.v2.ODataModel({
				serviceUrl: serviceName,
				headers: oHeaders
			});
			oDataModel.setUseBatch(false);
			this.getView().setBusy(true);
			oDataModel.metadataLoaded().then(function () {
				this.getOwnerComponent().setModel(oDataModel, "MatrixModel");
				this._fetchLoggedInUserPhoto();
				this.getApproverMatrixRequests();
				this.retrieveNAssignProcessCodeList();
				this.getRolesList();
				this.fnsortGroupData();
				// this._fnReadAfterMetadataLoaded(oDataModel);
			}.bind(this));
		},

		_fetchLoggedInUserPhoto: function () {
			//fetch photo
			var that = this;
			Services.fetchLoggeInUserImage(that, function (oResponse) {
				that.AppModel.setProperty("/staffPhoto", oResponse.photo ? "data:image/png;base64," + oResponse.photo : null);
			});
		},
		/**
		 * Get Approver Matrix Requests
		 */
		getApproverMatrixRequests: function () {
			var processCode = this.AppModel.getProperty("/processCode");
			if (processCode && processCode.trim().length > 0) {
				var sPath = "MatrixModel>/EclaimsApprovalMatrixViews";
				var oSorter = new sap.ui.model.Sorter({
					path: "UPDATED_ON",
					descending: true
				});
				var dFilter = Utility._fnApproverMatrixDefaultFilter(this);
				this.AppModel.setProperty("/defaultMatrixFilter", dFilter);
				var matrixFilter = Utility._fnApproverMatrixFilter(this);
				// var isDeptAdmin = component.AppModel.getProperty("/isDeptAdmin");
				if (this.AppModel.getProperty("/showAssignNewButton") || this.AppModel.getProperty("/userGrp") === this.getI18n(
						"ApproverMatrix.User.AppAdminGrp") || this.AppModel.getProperty("/userGrp") === this.getI18n(
						"ApproverMatrix.User.Ohrss")) {
					Utility._bindItems(this, "idApproverMatrixTable", sPath, oSorter, this.oTemplate, matrixFilter);
				}
			}
		},
		onClear: function () {
			this.AppModel.setProperty("/searchAttr", "");
			this.AppModel.setProperty("/asOfDate", "");
			this.AppModel.setProperty("/searchGroup", "");
			this.onSearchAssignmentRequest();
		},

		/**
		 * On Press Go Search the Approver Matrix Assignment Request
		 */
		onSearchAssignmentRequest: function () {
			var sPath = "MatrixModel>/EclaimsApprovalMatrixViews";
			var sValue = this.AppModel.getProperty("/searchAttr");
			var asOfDate = this.AppModel.getProperty("/asOfDate");
			var oGroup = this.AppModel.getProperty("/searchGroup");
			var userType = this.AppModel.getProperty("/searchUserType");
			var oSorter = new sap.ui.model.Sorter({
				path: "UPDATED_ON",
				descending: true
			});
			var aFilter = Utility._searchBasedOnParams(sValue, asOfDate, oGroup, userType, this);
			Utility._bindItems(this, "idApproverMatrixTable", sPath, oSorter, this.oTemplate, aFilter);
		},

		onCheckULU: function (oEvent) {
			var isChecked = oEvent.getParameter("selected");
			var assignmentModel = this.modelAssignment("AssignmentRequest");
			assignmentModel.setProperty("/ULU", isChecked ? this.getI18n("ApproverMatrix.AllSelection") : "");
			assignmentModel.setProperty("/ULU_T", isChecked ? this.getI18n("ApproverMatrix.AllSelection") : "");
			assignmentModel.setProperty("/FDLU", isChecked ? this.getI18n("ApproverMatrix.AllSelection") : "");
			assignmentModel.setProperty("/FDLU_T", isChecked ? this.getI18n("ApproverMatrix.AllSelection") : "");
			assignmentModel.setProperty("/isStaffEnabled", isChecked);
			assignmentModel.setProperty("/isFDLUEnabled", !isChecked);
			assignmentModel.setProperty("/isULUEnabled", !isChecked);
			assignmentModel.setProperty("/isAllFdluVisible", !isChecked);
			assignmentModel.setProperty("/ALL_FDLU", isChecked === true ? true : false);
		},
		onCheckFDLU: function (oEvent) {
			var isAllFDLUChecked = oEvent.getParameter("selected");
			var assignmentModel = this.modelAssignment("AssignmentRequest");
			assignmentModel.setProperty("/FDLU", isAllFDLUChecked ? this.getI18n("ApproverMatrix.AllSelection") : "");
			assignmentModel.setProperty("/FDLU_T", isAllFDLUChecked ? this.getI18n("ApproverMatrix.AllSelection") : "");
			assignmentModel.setProperty("/isStaffEnabled", isAllFDLUChecked);
			assignmentModel.setProperty("/isFDLUEnabled", !isAllFDLUChecked);
		},
		onPressRefreshApproverMatrix: function (oEvent) {
			this.getApproverMatrixDetails();
		},
		/**
		 * on Press Assign New
		 */
		onPressAssignNew: function () {
			this.openNewAssignment();
			this.AppModel.setProperty("/selectedRolesList", []);
		},
		openNewAssignment: function () {
			//Open a Dialog to show the Entire Data
			this.AppModel.setProperty("/oMode", "New");
			this.assignNewDialog = sap.ui.xmlfragment("AssignNewDialog",
				"nus.edu.sg.approvermatrix.view.fragments.AssignNewDialog", this);
			this.assignNewDialog.addStyleClass("sapUiSizeCompact");
			this.getView().addDependent(this.assignNewDialog);
			this.assignNewDialog.open();
			this.initializeAssignmentRequest();
		},

		onPressEditConfig: function (oEvent) {
			this.AppModel.setProperty("/oMode", "Edit");
			this.assignNewDialog = sap.ui.xmlfragment("AssignNewDialog",
				"nus.edu.sg.approvermatrix.view.fragments.AssignNewDialog", this);
			this.assignNewDialog.addStyleClass("sapUiSizeCompact");
			this.getView().addDependent(this.assignNewDialog);
			var sPath = oEvent.getSource().getBindingContext("MatrixModel").getPath();
			this.initializeAssignmentRequest(sPath, function (oData) {
				this.assignNewDialog.open();
			}.bind(this));
		},

		onPressDelimitConfig: function (oEvent) {
			//Open a Dialog to show the Entire Data
			this.assignNewDialog = sap.ui.xmlfragment("AssignNewDialog",
				"nus.edu.sg.approvermatrix.view.fragments.AssignNewDialog", this);
			this.assignNewDialog.addStyleClass("sapUiSizeCompact");
			this.getView().addDependent(this.assignNewDialog);

			var sPath = oEvent.getSource().getBindingContext("MatrixModel").getPath();
			this.initializeAssignmentRequest(sPath, function (oData) {
				this.assignNewDialog.open();
			}.bind(this));

		},

		initializeAssignmentRequest: function (sPath, callBack) {
			var assignmentModel = this.modelAssignment("AssignmentRequest");
			assignmentModel.setData({});
			var that = this;
			assignmentModel.setProperty("/isStaffEnabled", false);
			assignmentModel.setProperty("/isDelimitScenario", false);
			assignmentModel.setProperty("/delimitScenario", false);
			assignmentModel.setProperty("/isEditScenario", false);
			assignmentModel.setProperty("/processCodeList", this.AppModel.getProperty("/allowedProcessCodeList"));
			this.closeMessageStrip("assignmentMessageStripId", "AssignNewDialog");
			if (sPath) { //If Path exists
				var matrixModel = this.getComponentModel("MatrixModel");
				matrixModel.read(sPath, {
					success: function (oData) {
						if (oData) {
							Formatter._formatDataPerConfigurationDialog(oData);
							that.getRolesList(oData.PROCESS_CODE);
							assignmentModel.setData(oData);
							if (that.AppModel.getProperty("/oMode") === "Edit") {
								assignmentModel.setProperty("/isEditScenario", true);
							} else {
								assignmentModel.setProperty("/isStaffEnabled", true);
								assignmentModel.setProperty("/isDelimitScenario", true);
								assignmentModel.setProperty("/delimitScenario", true);
							}
							// that.retrieveProcessCodeList();
							that.manageUIVisibilityControls(assignmentModel, sPath);

							if (callBack) {
								callBack(oData);
							}
						}
					}.bind(this),
					error: function (oError) {}
				});
			} else {
				// this.getRolesList(true);
				// that.retrieveProcessCodeList();
				//Manage UI Visibility Controls
				this.manageUIVisibilityControls(assignmentModel);
				this.setInitialDataForNewAssignments(assignmentModel);
			}
		},
		manageUIVisibilityControls: function (assignmentModel, sPath) {
			var userGrp = this.AppModel.getProperty("/userGrp");
			assignmentModel.setProperty("/isSingleSubmissionSelected", true);
			assignmentModel.setProperty("/isMassUploadSelected", false);

			var processCode = this.AppModel.getProperty("/processCode");
			var isCWProcess = Boolean(processCode === this.getI18n("ApproverMatrix.processcode"));
			assignmentModel.setProperty("/isAllUluVisible", isCWProcess);
			assignmentModel.setProperty("/isAllFdluVisible", isCWProcess);
			// assignmentModel.setProperty("/isDeptAdminSingleSubmissionSelected", false);
			// assignmentModel.setProperty("/isDeptAdminMassUploadSelected", false);
			this.AppModel.setProperty("/isSelectionAllowed", false);
			this.AppModel.setProperty("/isDeptAdminUserNNew", false);
			assignmentModel.setProperty("/isMassUploadVisible", false);
			assignmentModel.setProperty("/isSubmitVisible", true);

			assignmentModel.setProperty("/isValidFromEnabled", sPath ? Formatter.isEnabledForChange(assignmentModel.getProperty("/VALID_FROM")) :
				true);
			assignmentModel.setProperty("/isValidToEnabled", sPath ? Formatter.isEnabledForChange(assignmentModel.getProperty("/VALID_TO")) :
				true);

			assignmentModel.setProperty("/isFormEditable", sPath ? false : true);
			// Begin of change - CCEV3364
			// assignmentModel.setProperty("/isFDLUEnabled", sPath ? false : false);
			assignmentModel.setProperty("/isFDLUEnabled", sPath ? false : true);
			// End of change -CCEV3364
			assignmentModel.setProperty("/isULUEnabled", sPath ? false : true);
			assignmentModel.setProperty("/isStaffEnabled", sPath ? false : assignmentModel.getProperty("/isStaffEnabled"));
			// assignmentModel.setProperty("/ALL_FDLU", sPath ? true : assignmentModel.getProperty("/ALL_FDLU"));
			// assignmentModel.setProperty("/ALL_ULU", sPath ? true : assignmentModel.getProperty("/ALL_ULU"));
			if (userGrp && userGrp === this.getI18n("ApproverMatrix.User.AdminGrp")) {
				assignmentModel.setProperty("/isSingleSubmissionSelected", true);
				assignmentModel.setProperty("/isMassUploadSelected", false);

				this.AppModel.setProperty("/isSelectionAllowed", sPath ? false : true);
				// assignmentModel.setProperty("/isAllFdluVisible", false);
				assignmentModel.setProperty("/isDesignationVisible", true);
				assignmentModel.setProperty("/isULUVisible", true);
				assignmentModel.setProperty("/isValidityVisible", true);
				assignmentModel.setProperty("/isAllUluVisible", sPath ? false : isCWProcess);
				assignmentModel.setProperty("/isAllFdluVisible", sPath ? false : isCWProcess);
				assignmentModel.setProperty("/isStaffSelectionVisible", true);
				assignmentModel.setProperty("/isMassUploadVisible", false);
				assignmentModel.setProperty("/isSubmitVisible", true);
				assignmentModel.setProperty("/isFDLUVisible", true);

				if (this.AppModel.getProperty("/oMode") === "Edit") {
					var oULU = assignmentModel.getProperty("/ULU"),
						oFDLU = assignmentModel.getProperty("/FDLU");
					assignmentModel.setProperty("/isULUEditable", true);
					assignmentModel.setProperty("/isFDLUEditable", true);
					assignmentModel.setProperty("/isFDLUEnabled", oFDLU === "ALL" ? false : true);
					assignmentModel.setProperty("/isULUEnabled", oULU === "ALL" ? false : true);
					assignmentModel.setProperty("/isAllUluVisible", isCWProcess);
					assignmentModel.setProperty("/isAllFdluVisible", isCWProcess);
					var sDate = assignmentModel.getProperty("/VALID_FROM");
					if (new Date(sDate) >= new Date())
						assignmentModel.setProperty("/isValidFromEnabled", true);
				}

			} else if (userGrp && userGrp === this.getI18n("ApproverMatrix.User.DeptAdminGrp")) {
				// assignmentModel.setProperty("/isDeptAdminSingleSubmissionSelected", true);
				// assignmentModel.setProperty("/isDeptAdminMassUploadSelected", false);
				this.AppModel.setProperty("/isSelectionAllowed", (sPath) ? false : true);
				assignmentModel.setProperty("/isDesignationVisible", true);
				assignmentModel.setProperty("/isULUVisible", true);
				// assignmentModel.setProperty("/isAllUluVisible", isCWProcess);
				// assignmentModel.setProperty("/isAllFdluVisible", isCWProcess);
				assignmentModel.setProperty("/isFDLUVisible", true);
				assignmentModel.setProperty("/isStaffSelectionVisible", true);
				assignmentModel.setProperty("/isValidityVisible", true);
				assignmentModel.setProperty("/isMassUploadVisible", false);
				assignmentModel.setProperty("/isSubmitVisible", true);
			}
		},
		/**
		 * Set Initial Data for New Assignments
		 */
		setInitialDataForNewAssignments: function (assignmentModel) {
			assignmentModel.setProperty("/VALID_FROM", Formatter.formatDateAsString(new Date(), "yyyy-MM-dd"));
			assignmentModel.setProperty("/VALID_TO", Formatter.formatDateAsString("9999-12-31", "yyyy-MM-dd"));

			var processCodeList = this.getComponentModel("LocalModel").getProperty("/processCodeList");
			var codeListLength = (processCodeList instanceof Array) ? processCodeList.length : 0;
			assignmentModel.setProperty("/PROCESS_CODE", (codeListLength === 2) ? processCodeList[codeListLength - 1].PROCESS_CODE : "");
		},
		onSelectRequestOption: function (oEvent) {
			if (oEvent.getParameter("selected")) {
				var sPath = oEvent.getSource().getBindingInfo("selected").parts[0].path;
				var assignmentModel = this.modelAssignment("AssignmentRequest");
				switch (sPath) {
				case "/isMassUploadSelected":
					assignmentModel.setProperty("/isDesignationVisible", false);
					assignmentModel.setProperty("/isULUVisible", false);
					assignmentModel.setProperty("/isValidityVisible", false);
					assignmentModel.setProperty("/isAllFdluVisible", false);
					assignmentModel.setProperty("/isStaffSelectionVisible", false);
					assignmentModel.setProperty("/isFDLUVisible", false);
					assignmentModel.setProperty("/isMassUploadVisible", true);
					assignmentModel.setProperty("/isSubmitVisible", false);
					assignmentModel.setProperty("/noOfHeaderRows", 2);
					assignmentModel.setProperty("/isAllUluVisible", false);
					break;
				case "/isSingleSubmissionSelected":
					assignmentModel.setProperty("/isDesignationVisible", true);
					assignmentModel.setProperty("/isULUVisible", true);
					assignmentModel.setProperty("/isValidityVisible", true);
					assignmentModel.setProperty("/isAllFdluVisible", true);
					assignmentModel.setProperty("/isFDLUVisible", true);
					assignmentModel.setProperty("/isStaffSelectionVisible", true);
					assignmentModel.setProperty("/isMassUploadVisible", false);
					assignmentModel.setProperty("/isSubmitVisible", true);
					assignmentModel.setProperty("/isAllUluVisible", true);
					break;
				}
			}
		},
		/**
		 * Load the Process Code List only at once in the Application Scope
		 */
		retrieveNAssignProcessCodeList: function () {
			var processCode = this.AppModel.getProperty("/processCode");
			var allowedProcessList = this.AppModel.getProperty("/allowedProcessCodeList");
			if (processCode && processCode.trim().length > 0 && !(allowedProcessList || (allowedProcessList instanceof Array &&
					allowedProcessList.length > 0))) {
				var assignmentModel = this.modelAssignment("AssignmentRequest");
				var sPath = "/ProcessConfigs";
				var processDesignationFilter = Utility._fnProcessCodeFilter(this);
				var matrixModel = this.getComponentModel("MatrixModel");
				var newAssignBtnVisible = this.AppModel.getProperty("/showAssignNewButton");
				this.AppModel.setProperty("/showAssignNewButton", false);
				matrixModel.read(sPath, {
					filters: processDesignationFilter,
					success: function (oData) {
						if (oData) {
							this.AppModel.setProperty("/allowedProcessCodeList", oData.results);
							this.AppModel.setProperty("/showAssignNewButton", newAssignBtnVisible);
							this.getView().setBusy(false);
						}
					}.bind(this),
					error: function (oError) {
						console.log(oError);
					}
				});
			} else {
				this.getView().setBusy(false);
			}
		},
		/**
		 * Retrieve Lookup Data for Selecting roles
		 */
		getRolesList: function (selectedProcess) {
			var processCode = (selectedProcess) ? selectedProcess : this.AppModel.getProperty("/processCode");
			if (processCode && processCode.trim().length > 0) {
				var assignmentModel = this.modelAssignment("AssignmentRequest");
				var sPath = "/AppConfigurations";
				var designationFilter = Utility._fnDesignationFilter(this, processCode);
				var matrixModel = this.getComponentModel("MatrixModel");
				matrixModel.read(sPath, {
					filters: designationFilter,
					success: function (oData) {
						if (oData) {
							var tempList = Formatter._formatDesignationList(oData);
							this.AppModel.setProperty((selectedProcess) ? "/selectedRolesList" : "/designationList", tempList);
						}
					}.bind(this),
					error: function (oError) {}
				});
			}
		},

		/**
		 * Close New Assignment Dialog
		 */
		closeAssignmentDialog: function () {
			if (this.assignNewDialog) {
				this.assignNewDialog.close();
				this.assignNewDialog.destroy();
				this.assignNewDialog = null;
				this.assignNewDialog = undefined;
			}
		},
		onCancelMassUploadAfterValidation: function () {
			this._oMassUploadResponse.close();
			this._oMassUploadResponse.destroy();
			this._oMassUploadResponse = undefined;
			this._oMassUploadResponse = null;
		},

		handleConfirmSelection: function (oEvent) {
			// reset the filter
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([]);

			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				var sPath = aContexts[0].getPath();
				var staffModel = this.modelAssignment("StaffModel");
				var assignmentModel = this.modelAssignment("AssignmentRequest");
				var selectedStaff = staffModel.getProperty(sPath);
				assignmentModel.setProperty("/STAFF_ID", selectedStaff.STF_NUMBER);
				assignmentModel.setProperty("/FULL_NM", selectedStaff.FULL_NM);
				assignmentModel.setProperty("/NUSNET_ID", selectedStaff.STAFF_NUSNET_ID);
			}
		},
		/**
		 * On Select Process Code / Populate the Designation List
		 */
		onSelectProcessCode: function (oEvent, component) {
			var assignmentModel = this.modelAssignment("AssignmentRequest");
			var selectedProcess = oEvent.getSource().getProperty("selectedKey");
			assignmentModel.setProperty("/PROCESS_CODE", selectedProcess);

			assignmentModel.setProperty("/ULU", "");
			assignmentModel.setProperty("/ULU_T", "");
			assignmentModel.setProperty("/FDLU", "");
			assignmentModel.setProperty("/FDLU_T", "");
			assignmentModel.setProperty("/STAFF_USER_GRP", "");
			//Control Roles List Lookup upon Process Code Selection
			if (selectedProcess) {
				this.getRolesList(selectedProcess);
			} else {
				assignmentModel.setProperty("/selectedRolesList", []);
			}
		},
		/**
		 * On Select Role From UI
		 */
		onSelectRole: function (oEvent, component) {
			var assignmentModel = this.modelAssignment("AssignmentRequest");
			var selectedDesignation = oEvent.getSource().getProperty("selectedKey");
			assignmentModel.setProperty("/STAFF_USER_GRP", selectedDesignation);

			assignmentModel.setProperty("/STAFF_ID", "");
			assignmentModel.setProperty("/FULL_NM", "");
			assignmentModel.setProperty("/NUSNET_ID", "");

			var processCode = this.AppModel.getProperty("/processCode");
			var isCWProcess = Boolean(processCode === this.getI18n("ApproverMatrix.processcode"));

			var isAccessConfig = (this.getI18n("ApproverMatrix.AllGroups").includes(selectedDesignation));

			assignmentModel.setProperty("/ULU", "");
			assignmentModel.setProperty("/ULU_T", "");
			assignmentModel.setProperty("/FDLU", "");
			assignmentModel.setProperty("/FDLU_T", "");
			assignmentModel.setProperty("/isStaffEnabled", false);
			assignmentModel.setProperty("/isFDLUEnabled", true);
			assignmentModel.setProperty("/isULUEnabled", true);
			assignmentModel.setProperty("/isAllFdluVisible", isCWProcess);
			assignmentModel.setProperty("/isAllUluVisible", isCWProcess);
			assignmentModel.setProperty("/ALL_FDLU", false);
			assignmentModel.setProperty("/ALL_ULU", false);

			//Handle for Config Admin Assignments
			if (isAccessConfig) {
				assignmentModel.setProperty("/ULU", this.getI18n("ApproverMatrix.AllSelection"));
				assignmentModel.setProperty("/ULU_T", this.getI18n("ApproverMatrix.AllSelection"));
				assignmentModel.setProperty("/FDLU", this.getI18n("ApproverMatrix.AllSelection"));
				assignmentModel.setProperty("/FDLU_T", this.getI18n("ApproverMatrix.AllSelection"));
				assignmentModel.setProperty("/isStaffEnabled", isAccessConfig);
				assignmentModel.setProperty("/isFDLUEnabled", !isAccessConfig);
				assignmentModel.setProperty("/isULUEnabled", !isAccessConfig);
				assignmentModel.setProperty("/isAllFdluVisible", !isAccessConfig);
				assignmentModel.setProperty("/isAllUluVisible", !isAccessConfig);
				assignmentModel.setProperty("/ALL_ULU", isAccessConfig);
				assignmentModel.setProperty("/ALL_FDLU", isAccessConfig);
			}

		},
		/**
		 * Lookup Value Help
		 */
		lookupValueHelp: function (oEvent) {
			this.closeMessageStrip("assignmentMessageStripId", "AssignNewDialog");
			var src = oEvent.getSource();
			var bindingControl = oEvent.getSource().getBindingInfo("value").parts[0].path;
			var assignmentData = this.modelAssignment("AssignmentRequest").getData();

			if (bindingControl === "/FULL_NM") {
				src.setUrlAttr(assignmentData.isExternalStaff ? Config.dbOperations.externalUserInfo : Config.dbOperations.staffUserInfo);
			}

			var urlPath = src.getUrlAttr();
			var sServiceUrl = Config.dbOperations.metadataClaims + urlPath;

			src.setUrlPath(sServiceUrl);
			var modelData = null;
			var userGrp = this.AppModel.getProperty("/userGrp");

			if (userGrp && userGrp === this.getI18n("ApproverMatrix.User.AdminGrp")) { // If OFN Admin or OHR Admin
				if (bindingControl === "/FDLU_T" && assignmentData.ULU) {
					sServiceUrl += "&$filter=ULU_C eq '" + assignmentData.ULU + "'";
				}
			} else if (userGrp && userGrp === this.getI18n("ApproverMatrix.User.DeptAdminGrp") && (bindingControl === "/FDLU_T" ||
					bindingControl === "/ULU_T")) {
				src.setDataPath("/");
				modelData = this.manageLookupForUluFdluDeptAdmin(bindingControl, assignmentData);
			}

			var isAsync = Boolean(bindingControl === "/FULL_NM");
			src.setUrlPath(sServiceUrl);
			var oHeaders = Formatter._amendHeaderToken(this);
			var that = this;
			src.openValueHelp(oEvent, null, isAsync, modelData, true, oHeaders, function (selectedObj) {
				that.setValuesFromLookup(bindingControl, selectedObj);
			});
		},
		manageLookupForUluFdluDeptAdmin: function (bindingControl, assignmentData) {
			// var assignmentModel = this.modelAssignment("AssignmentRequest");
			var modelData = Formatter._formatUluFdlu(this, assignmentData.ULU, assignmentData.PROCESS_CODE);
			// assignmentModel.setProperty("/isAllFdluVisible", uluFdluData.isFdluRequired);

			if (bindingControl === "/FDLU_T" && assignmentData.ULU) {
				var approverMatrix = this.AppModel.getProperty("/staffInfo/approverMatrix");
				modelData = Utility._getDataToShowInLookupforFdlu(approverMatrix, assignmentData.ULU);
			}
			return modelData;
		},

		/**
		 * Set Values From Lookup
		 */
		setValuesFromLookup: function (bindingControl, selectedObj) {
			var oMode = this.AppModel.getProperty("/oMode");
			var assignmentModel = this.modelAssignment("AssignmentRequest");

			var userGrp = this.AppModel.getProperty("/userGrp");
			switch (bindingControl) {
			case "/ULU_T":
				var oFDLU = assignmentModel.getProperty("/FDLU");
				assignmentModel.setProperty("/ULU", selectedObj.ULU_C);
				assignmentModel.setProperty("/ULU_T", selectedObj.ULU_T);
				if (oMode !== "Edit") {
					assignmentModel.setProperty("/STAFF_ID", "");
					assignmentModel.setProperty("/FULL_NM", "");
					assignmentModel.setProperty("/NUSNET_ID", "");
				}
				assignmentModel.setProperty("/FDLU", "");
				assignmentModel.setProperty("/FDLU_T", "");
				assignmentModel.setProperty("/isStaffEnabled", false);
				assignmentModel.setProperty("/isFDLUEnabled", true);
				if (userGrp && userGrp === this.getI18n("ApproverMatrix.User.DeptAdminGrp")) {
					assignmentModel.setProperty("/isAllFdluVisible", Formatter._checkIfFDLURequired(this, selectedObj.ULU_C));
				}
				break;
			case "/FDLU_T":
				assignmentModel.setProperty("/FDLU", selectedObj.FDLU_C);
				assignmentModel.setProperty("/FDLU_T", selectedObj.FDLU_T);
				if (oMode !== "Edit") {
					assignmentModel.setProperty("/STAFF_ID", "");
					assignmentModel.setProperty("/FULL_NM", "");
					assignmentModel.setProperty("/NUSNET_ID", "");
					assignmentModel.setProperty("/isStaffEnabled", true);
				}
				break;
			case "/FULL_NM":
				selectedObj.STF_NUMBER = selectedObj.STF_NUMBER.replace("(" + selectedObj.NUSNET_ID + ")", "").trim();
				assignmentModel.setProperty("/STAFF_ID", selectedObj.STF_NUMBER);
				assignmentModel.setProperty("/FULL_NM", selectedObj.FULL_NM);
				assignmentModel.setProperty("/STAFF_NUSNET_ID", selectedObj.NUSNET_ID);
				if (userGrp && userGrp === this.getI18n("ApproverMatrix.User.DeptAdminGrp")) {
					this.validateConfigurationForDeptAdmin(assignmentModel);
				}
				break;
			default:
				break;
			}

		},
		/**
		 * Validate Configuration For Department Admin
		 */
		validateConfigurationForDeptAdmin: function (assignmentModel) {
			var processCode = assignmentModel.getProperty("/PROCESS_CODE");
			var isStaffAllowed = true;

			switch (processCode) {
			case "101":
			case "102":
			case "103":
				isStaffAllowed = this.handleValidationForEClaims(assignmentModel);
				break;
			default:
				break;
			}

			if (!isStaffAllowed) {
				assignmentModel.setProperty("/STAFF_ID", "");
				assignmentModel.setProperty("/FULL_NM", "");
				assignmentModel.setProperty("/NUSNET_ID", "");
				this.showMessageStrip("assignmentMessageStripId", "Department Admin can't be Verifier / Approver ", "E", "AssignNewDialog");
			}
		},
		handleValidationForEClaims: function (assignmentModel) {
			var assignmentData = assignmentModel.getData();
			var approverMatrix = this.AppModel.getProperty("/staffInfo/approverMatrix");
			var that = this;
			var isStaffAllowed = true;
			jQuery.sap.each(approverMatrix, function (i, authMatrixElement) {
				if (assignmentData.STAFF_ID === authMatrixElement.STF_NUMBER && ((assignmentData.STAFF_USER_GRP === that.getI18n(
						"ApproverMatrix.User.Verifier")) || (assignmentData.STAFF_USER_GRP === that.getI18n("ApproverMatrix.User.Approver")))) {
					isStaffAllowed = false;
					// assignmentModel.setProperty("/STAFF_ID", "");
					// assignmentModel.setProperty("/FULL_NM", "");
					// assignmentModel.setProperty("/NUSNET_ID", "");
				}
			});
			return isStaffAllowed;
		},

		/**
		 * Confirmation Dialog before performing any task level operation
		 */
		confirmOnAction: function (actionType, callBack) {
			var confirmationText = this.getI18n("ApproverMatrix.Confirmation." + actionType);
			var dialog = new Dialog({
				title: "Confirmation",
				type: "Message",
				content: new sap.m.Text({
					text: confirmationText,
					visible: (actionType !== "Forward")
				}),
				beginButton: new sap.m.Button({
					text: "Yes",
					icon: "sap-icon://action",
					press: function () {
						dialog.close();
						callBack();
					}
				}),
				endButton: new sap.m.Button({
					text: "No",
					icon: "sap-icon://decline",
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();
		},
		onPressDeleteConfig: function (oEvent) {
			var sPath = oEvent.getSource().getBindingContext("MatrixModel").getPath();
			var that = this;
			this.confirmOnAction("D", function () {
				that.persistentOperationCalled(sPath, true);
			});

		},
		/**
		 * Check Assignment Date Range Validity
		 */
		onChangeValidateDateRange: function (oEvent) {
			this.closeMessageStrip("assignmentMessageStripId", "AssignNewDialog");
			var validationMsg = Validation.validateDateRangeAssignment(this);
			var sPath = oEvent.getSource().getBindingInfo("value").parts[0].path;
			if (validationMsg) {
				if (oEvent) {
					var assignmentModel = this.modelAssignment("AssignmentRequest");
					var dateVal = (sPath && sPath === "/VALID_FROM") ? new Date() : "9999-12-31";
					assignmentModel.setProperty(sPath, Formatter.formatDateAsString(dateVal, "yyyy-MM-dd"));
				}
				this.showMessageStrip("assignmentMessageStripId", validationMsg, "E", "AssignNewDialog");
			}
		},
		persistentOperationCalled: function (sPath, isDelete, assignmentReqData) {
			var that = this;
			var oHeaders = Formatter._amendHeaderToken(this);
			if (sPath) {
				//Retrieve for Existing and then Deleting
				this.initializeAssignmentRequest(sPath, function (data) {
					Services.persistAssignmentData(that, oHeaders, isDelete, data, function (response) {
						that.handleMatrixReq(response);
					});
				});
			} else {
				//Handle for Submission
				Services.persistAssignmentData(that, oHeaders, isDelete, assignmentReqData, function (response) {
					that.handleMatrixReq(response);
				});
			}
			// this.getComponentModel("LocalModel").setProperty("/uibinding/isStaffEnabled", false);
		},
		onPressSubmitAssignmentRequest: function (oEvent, saveSource, sourceReq) {
			// var assignObj = this.modelAssignment("AssignmentRequest").getData();
			var sText = oEvent.getSource().getText() === "Submit" ? "S" : "U";
			this.closeMessageStrip("assignmentMessageStripId", "AssignNewDialog");
			var validationMsg = Validation.validateAssignmentRequest(this);
			if (!validationMsg) {
				this.confirmOnAction(sText, function () {
					this.persistentOperationCalled(null, false, this.modelAssignment("AssignmentRequest").getData());
				}.bind(this));

			}
		},
		handleMatrixReq: function (response, isMassUpload) {
			if (response && response instanceof Array) {
				response = response[0];
				var that = this;
				if (response.STATUS_CODE === "S") {
					MessageBox.alert(response.MESSAGE, {
						icon: MessageBox.Icon.SUCCESS,
						title: "Success",
						onClose: function () {
							that.closeAssignmentDialog();
							// that.getApproverMatrixDetails();
							that.onSearchAssignmentRequest();
						}
					});
				} else {
					if (!isMassUpload)
						this.showMessageStrip("assignmentMessageStripId", response.MESSAGE, response.STATUS_CODE, "AssignNewDialog");
				}
			} else {
				if (!isMassUpload)
					this.showMessageStrip("assignmentMessageStripId", "Technical Error Occurred and couldn't be saved", "E", "AssignNewDialog");
			}
			// this.hideBusyIndicator();
		},
		/**
		 * on Press Mass Upload Requests
		 */
		onPressMassUploadTemplate: function (oEvent) {
			try {
				MassUploadHelper._onPressMassUploadTemplate(this, this.modelAssignment("AssignmentRequest"));
			} catch (oError) {
				this.hideBusyIndicator();
			}
		},
		onMessagePopoverPress: function (oEvent) {
			MassUploadHelper._onMessagePopoverPress(oEvent, this);
		},
		onSubmitMassUploadAfterValidation: function () {
			this.showBusyIndicator();
			var aRequestPayload = this.AppModel.getProperty("/excelResponse/matrix_payload");
			var aPayload = [];
			jQuery.sap.each(aRequestPayload, function (a, element) {
				if (!element.errorMessage) {
					aPayload.push(element);
				}
			});

			if (aPayload.length) {
				MassUploadHelper._fnPostMassSubmission(aPayload, this);
			} else {
				MessageBox.error("There are no records to submit..!!");
				this.hideBusyIndicator();
				return;
			}
		},

		// sorting and Grouping 

		fnsortGroupData: function () {
			var LookupData = [{
				"key": "PROCESS_TITLE",
				"selectedStatus": true,
				"text": "Process Code"
			}, {
				"key": "ULU_T",
				"selectedStatus": false,
				"text": "ULU"
			}, {
				"key": "FDLU_T",
				"selectedStatus": false,
				"text": "FDLU"
			}, {
				"key": "FULL_NM",
				"selectedStatus": false,
				"text": "Staff Name"
			}, {
				"key": "STAFF_USER_ALIAS",
				"selectedStatus": false,
				"text": "Role"
			}, {
				"key": "VALID_FROM",
				"selectedStatus": false,
				"text": "Valid From"
			}, {
				"key": "VALID_TO",
				"selectedStatus": false,
				"text": "Valid To"
			}, {
				"key": "UPDATED_ON",
				"selectedStatus": false,
				"text": "Changed On"
			}];

			this.AppModel.setProperty("/sortingLookupData", LookupData);
			this.AppModel.setProperty("/groupLookupData", LookupData);

		},

		onPressGroupRequest: function (oEvent, key) {
			var sDialogTab = "group";
			if (!this._pViewSettingsDialog) {
				this._pViewSettingsDialog = Fragment.load({
					id: this.getView().getId(),
					name: "nus.edu.sg.approvermatrix.view.fragments.ViewSettingsDialog",
					controller: this
				}).then(function (oDialog) {
					this.getView().addDependent(oDialog);
					return oDialog;
				}.bind(this));
			}
			this._pViewSettingsDialog.then(function (oDialog) {
				oDialog.open(sDialogTab);
			});
		},

		onPressSortRequest: function (oEvent) {
			var sDialogTab = "sort";
			if (!this._pViewSettingsDialog) {
				this._pViewSettingsDialog = Fragment.load({
					id: this.getView().getId(),
					name: "nus.edu.sg.approvermatrix.view.fragments.ViewSettingsDialog",
					controller: this
				}).then(function (oDialog) {
					this.getView().addDependent(oDialog);
					return oDialog;
				}.bind(this));
			}
			this._pViewSettingsDialog.then(function (oDialog) {
				oDialog.open(sDialogTab);
			});
		},

		handleConfirm: function (oEvent) {
			// this._pViewSettingsDialog = undefined;
			// this._pViewSettingsDialog = null;
			var oTable = this.getUIControl("idApproverMatrixTable");
			var oSelectedSort = oEvent.getParameter("sortItem");
			var sortingMethod = oEvent.getParameter("sortDescending");
			var oSelectedGroup = oEvent.getParameter("groupItem");
			var groupMethod = oEvent.getParameter("groupDescending");
			var mParams = oEvent.getParameters(),
				oBinding = oTable.getBinding("items"),
				sPath,
				bDescending,
				aSorters = [],
				vGroup,
				aGroups = [];

			if (oSelectedSort) {
				sPath = mParams.sortItem.getKey();
				bDescending = mParams.sortDescending;
				aSorters.push(new Sorter(sPath, bDescending));
				oBinding.sort(aSorters);
			}

			if (oSelectedGroup) {
				sPath = mParams.groupItem.getKey();
				bDescending = mParams.groupDescending;
				aGroups.push(new Sorter(sPath, bDescending, true));
				oBinding.sort(aGroups);
			}
		},

		/**
		 * On Press Export
		 */
		onPressExport: function () {
			var approverMatrixTable = this.byId('idApproverMatrixTable');
			var oRowBinding = approverMatrixTable.getBinding('items');
			var EdmType = exportLibrary.EdmType;
			// var aCols = Utility._createColumnConfig(this, EdmType);
			var userGrp = this.AppModel.getProperty("/userGrp");
			var tempName = (userGrp && userGrp === this.getI18n("ApproverMatrix.User.AdminGrp")) ? "Admin" : "Department Admin";
			var aCols = Utility._createColumnConfigForMassResponse(this, EdmType, false);
			var oSettings = {
				workbook: {
					columns: aCols,
					context: {
						sheetName: "Configuration Sheet"
					}
				},
				dataSource: oRowBinding,
				fileName: 'Matrix Configuration List Extract for ' + tempName + '.xlsx',
				worker: false // We need to disable worker because we are using a MockServer as OData Service
			};

			var oSheet = new Spreadsheet(oSettings);
			oSheet.build().finally(function () {
				oSheet.destroy();
			});
		},
		onExportMassUploadResponse: function () {
			var aRows, oSettings, oSheet;
			var EdmType = exportLibrary.EdmType;
			var aCols = Utility._createColumnConfigForMassResponse(this, EdmType, true);
			aRows = this.AppModel.getProperty("/excelResponse/matrix_payload");
			oSettings = {
				workbook: {
					columns: aCols,
					context: {
						sheetName: "Matrix Response Details"
					}
				},
				dataSource: aRows,
				fileName: "MassMatrixUploadResponse.xlsx"
			};

			oSheet = new Spreadsheet(oSettings);
			oSheet.build()
				.then(function () {
					MessageToast.show('Approver Matrix Response downloaded successfully..!!');
				})
				.finally(oSheet.destroy);
		}
	});
});