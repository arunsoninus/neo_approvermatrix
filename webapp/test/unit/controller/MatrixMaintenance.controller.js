/*global QUnit*/

sap.ui.define([
	"nus/edu/sg/approvermatrix/controller/MatrixMaintenance.controller"
], function (Controller) {
	"use strict";

	QUnit.module("MatrixMaintenance Controller");

	QUnit.test("I should test the MatrixMaintenance controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});