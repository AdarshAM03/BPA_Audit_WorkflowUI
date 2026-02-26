sap.ui.define(
  [
    "sap/ui/core/mvc/Controller"
  ],
  function (BaseController) {
    "use strict";

    return BaseController.extend("bpaaudit.workflowuimodule.controller.App", {
      onInit() {
      },
     // This runs after the UI is visible to the user
            onAfterRendering() {
                this._fetchAuditData();
            },

            _fetchAuditData: function () {
                const oView = this.getView();
                const sCustId = oView.getModel("context").getProperty("/customerID");

                // AJAX call to your CAPM service
                const sUrl = "https://8d0b19adtrial-dev-newloanfeature-srv.cfapps.us10-001.hana.ondemand.com";

                $.ajax({
                    url: sUrl,
                    method: "GET",
                    success: (oData) => {
                        const aLogs = oData.value || [];
                        this._applyDynamicStyles(aLogs);
                    },
                    error: (err) => {
                        console.error("Audit log fetch failed", err);
                    }
                });
            },

            _applyDynamicStyles: function (aLogs) {
                const oView = this.getView();

                // 1. Map for Simple Form Inputs
                const oFieldMap = {
                    "customerID": "_IDGenInput",
                    "name": "_IDGenInput1",
                    "email": "_IDGenInput2",
                    "phone": "_IDGenInput3"
                };

                aLogs.forEach(log => {
                    const sPath = log.field;

                    // 2. Handle Nested Table Fields (e.g., "Product[ID:12].productName")
                    if (sPath.includes("[")) {
                        this._highlightTableRow(sPath);
                    } 
                    // 3. Handle Top-Level Fields (e.g., "name", "email")
                    else {
                        const sUiId = oFieldMap[sPath];
                        const oControl = oView.byId(sUiId);
                        if (oControl) {
                            oControl.addStyleClass("editedField");
                        }
                    }
                });
            },

            _highlightTableRow: function (sPath) {
                // Parse Product[ID:12].productName
                const match = sPath.match(/ID:(.+?)\]\.(.+)/);
                if (!match) return;

                const sIdValue = match[1]; // "12"
                const sPropName = match[2]; // "productName"

                // Determine which table to look in
                const sTableId = sPath.startsWith("Product") ? "productTable" : "orderTable";
                const oTable = this.getView().byId(sTableId);
                
                if (oTable) {
                    const aItems = oTable.getItems();
                    aItems.forEach(oItem => {
                        // Match ID from the row's context
                        const sRowId = oItem.getBindingContext("context").getProperty(sPath.startsWith("Product") ? "productID" : "orderID");
                        
                        if (String(sRowId) === sIdValue) {
                            const oCells = oItem.getCells();
                            // Mapping column indices based on your XML order
                            const oColMap = sPath.startsWith("Product") 
                                ? { "productID": 0, "productName": 1, "price": 2, "category": 3 }
                                : { "orderID": 0, "orderDate": 1, "quantity": 2, "totalAmount": 3 };
                            
                            const iIdx = oColMap[sPropName];
                            if (iIdx !== undefined && oCells[iIdx]) {
                                oCells[iIdx].addStyleClass("editedField");
                            }
                        }
                    });
                }
            }
        });
  }
);
