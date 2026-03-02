sap.ui.define(
	[
		"sap/ui/core/mvc/Controller",
		"sap/ui/model/json/JSONModel",
		"sap/m/MessageToast"
	],
	function (Controller, JSONModel, MessageToast) {
		"use strict";

		return Controller.extend("bpaaudit.workflowuimodule.controller.App", {

			/* =========================================================== */
			/* ======================= INIT =============================== */
			/* =========================================================== */

			onInit: function () {

				const oComponentData = this.getOwnerComponent().getComponentData();

				if (oComponentData && oComponentData.startupParameters) {

					const startupParams = oComponentData.startupParameters;
					const taskModel = startupParams.taskModel;
					const taskId = taskModel.getData().InstanceID;

					console.log("Task ID:", taskId);

					// Step 1: Fetch workflow context
					this._fetchWorkflowContext(taskId);
				}
			},


			/* =========================================================== */
			/* ========== FETCH WORKFLOW CONTEXT ========================= */
			/* =========================================================== */

			_fetchWorkflowContext: function (taskId) {

				const that = this;
				const oView = this.getView();

				const sUrl = "/api/workflow/rest/v1/task-instances/" + taskId + "/context";

				$.ajax({
					url: sUrl,
					method: "GET",
					contentType: "application/json",
					dataType: "json",

					success: function (data) {

						console.log("Workflow Context Retrieved:", data);

						const oContextModel = new JSONModel(data);
						oView.setModel(oContextModel, "contextModel");

						// ⚠️ Make sure this field contains the workflow instance ID
						that._sInstanceID = data.phone;

						console.log("Stored InstanceID:", that._sInstanceID);

						// Step 2: Fetch ChangeLogs for this instance
						that._fetchChangeLogs();
					},

					error: function (error) {
						console.error("Error fetching workflow context:", error);
					}
				});
			},


			/* =========================================================== */
			/* ========== FETCH CHANGE LOGS =============================== */
			/* =========================================================== */

			_fetchChangeLogs: function () {

				const that = this;

				const sUrl =
					"https://8d0b19adtrial-dev-newloanfeature-srv.cfapps.us10-001.hana.ondemand.com/odata/v4/simple/ChangeLogs?$filter=BpaInstanceID eq '" +
					that._sInstanceID + "'";

				console.log("Fetching ChangeLogs for Instance:", that._sInstanceID);

				$.ajax({
					url: sUrl,
					method: "GET",
					dataType: "json",

					success: function (oData) {

						if (!oData || !oData.value || oData.value.length === 0) {
							console.log("No ChangeLogs found");
							return;
						}

						console.table(oData.value);

						// Step 3: Extract customerID
						const sCustomerID = oData.value[0].customerID;

						console.log("Customer ID extracted:", sCustomerID);

						// Store logs globally
						that._aChangeLogs = oData.value;

						// Load customer first
						that._loadCustomerData(sCustomerID);
					},

					error: function (oError) {
						console.error("Failed to fetch ChangeLogs:", oError);
					}
				});
			},


			/* =========================================================== */
			/* ========== LOAD CUSTOMER DATA ============================= */
			/* =========================================================== */

			_loadCustomerData: function (customerID) {
				const that = this;
				const oView = this.getView();

				const sUrl =
					"https://8d0b19adtrial-dev-newloanfeature-srv.cfapps.us10-001.hana.ondemand.com/odata/v4/simple/Customers(customerID="
					+ customerID +
					",IsActiveEntity=true)?$expand=customerToproducts,customerToorder";

				console.log("Loading Customer:", customerID);

				$.ajax({
					url: sUrl,
					method: "GET",
					dataType: "json",

					success: function (oCustomer) {

						console.log("Customer Loaded:", oCustomer);

						const oModel = new JSONModel(oCustomer);
						oView.setModel(oModel, "context");
						// Wait for UI to render
						setTimeout(function () {
							that._applyHighlights();
						}, 300);
					},

					error: function (oError) {
						console.error(oError);
						MessageToast.show("Failed to load customer");
					}
				});
			},
			_applyHighlights: function () {

				const that = this;

				if (!this._aChangeLogs) return;

				this._aChangeLogs.forEach(function (item) {

					const field = item.field;

					// 🔹 Customer fields
					if (field === "name") {
						that.byId("_IDGenText1").addStyleClass("highlightField");
					}

					if (field === "email") {
						that.byId("_IDGenText2").addStyleClass("highlightField");
					}

					if (field === "phone") {
						that.byId("_IDGenText3").addStyleClass("highlightField");
					}

					// 🔹 Product nested fields
					if (field.startsWith("Product[")) {

						const match = field.match(/Product\[ID:(\d+)\]\.(.+)/);

						if (match) {

							const productID = match[1];
							const property = match[2];

							that._highlightProductField(productID, property);
						}
					}
					if (field.startsWith("Order[")) {

						const match = field.match(/Order\[ID:([^\]]+)\]\.(.+)/);

						if (match) {

							const orderID = match[1];     // UUID
							const property = match[2];    // quantity, orderDate, totalAmount

							that._highlightOrderField(orderID, property);
						}
					}

				});
			},
			_highlightProductField: function (productID, property) {

				const oTable = this.byId("productTable");
				const aItems = oTable.getItems();

				const columnMap = {
					productName: 1,
					price: 2,
					category: 3
				};

				aItems.forEach(function (oItem) {

					const cells = oItem.getCells();
					const currentProductID = cells[0].getText();

					if (String(currentProductID) === String(productID)) {

						const columnIndex = columnMap[property];

						if (columnIndex !== undefined) {
							cells[columnIndex].addStyleClass("highlightField");
						}
					}
				});
			},
			_highlightOrderField: function (orderID, property) {

				const oTable = this.byId("orderTable");
				const aItems = oTable.getItems();

				const columnMap = {
					orderDate: 1,
					quantity: 2,
					totalAmount: 3
				};

				aItems.forEach(function (oItem) {

					const cells = oItem.getCells();

					// orderID is first column
					const currentOrderID = cells[0].getText();

					if (String(currentOrderID) === String(orderID)) {

						const columnIndex = columnMap[property];

						if (columnIndex !== undefined) {
							cells[columnIndex].addStyleClass("highlightField");
						}
					}
				});
			},

		});
	}
);