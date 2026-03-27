sap.ui.define([],
	function () {

		return {
			getRandomNumber: function () {
				return Math.floor(Math.random() * Math.floor(5));
			},
			taskOperations: {},
			gwTaskOperations: {},
			sfOperations: {},
			processOperations: {},
			dbOperations: {
				authorizeToken: "/tokenauthorize?username=",
				userDetails: "/rest/utils/getUserDetails",
				fetchPhotoUser: "/rest/photo/api",
				createAuthMatrixUrl: "/rest/utils/approverMatrix/createEntry",
				deleteAuthMatrixUrl : "/rest/utils/approverMatrix/deleteEntry",
				metadataClaims: "/odata/eclaims",
				chrsJobInfo: "/ChrsJobInfos",
				staffUserInfo : "/ChrsJobInfos?$select=NUSNET_ID,FULL_NM,STF_NUMBER",
				externalUserInfo : "/ChrsExternalUsersInfos?$select=NUSNET_ID,FULL_NM,STF_NUMBER",
				ulufdluEntitySet: "/ChrsFdluUlus",
				statusConfig: "/StatusConfigs",
				fetchClaimType: "/rest/eclaims/fetchClaimTypes?staffId=",
				caStaffLookUp: "/rest/eclaims/caStaffLookup",
				matrixUploadExcel : "/rest/utils/matrixReqUpload",
				deptAdminAuthUrl : "/rest/utils/getDepartmentAdminAssignments"
			}

		};
	});