/**
 * Copyright (c) 2008-2011 The Open Planning Project
 * 
 * Published under the GPL license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

/**
 * @requires plugins/Tool.js
 * @requires widgets/WMSStylesDialog.js
 * @requires plugins/GeoServerStyleWriter.js
 * @requires widgets/PointSymbolizerMod.js
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = Styler
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("gxp.plugins");

/** api: constructor
 *  .. class:: Styler(config)
 *
 *    Plugin providing a styles editing dialog for geoserver layers.
 */
Viewer.plugins.Styler = Ext.extend(gxp.plugins.Styler, {
    
    /** api: ptype = vw_styler */
    ptype: "vw_styler",

    id: 'styler_component',

    /** private: method[checkIfStyleable]
     *  :arg layerRec: ``GeoExt.data.LayerRecord``
     *  :arg describeRec: ``Ext.data.Record`` Record from a 
     *      `GeoExt.data.DescribeLayerStore``.
     *
     *  Given a layer record and the corresponding describe layer record, 
     *  determine if the target layer can be styled.  If so, enable the launch 
     *  action.
     */
    checkIfStyleable: function(layerRec, describeRec) {
        if (describeRec) {
            var owsTypes = ["WFS"];
            if (this.rasterStyling === true) {
                owsTypes.push("WCS");
            }
        }
        if (describeRec ? owsTypes.indexOf(describeRec.get("owsType")) !== -1 : !this.requireDescribeLayer) {
            var editableStyles = false;
            var source = this.target.getSource(layerRec); // #78426 modify getSource() in composer
            var url;
            // TODO: revisit this
            var restUrl = layerRec.get("restUrl");
            if (restUrl) {
                url = restUrl + "/styles";
            } else {
                url = source.url.split("?")
                    .shift().replace(/\/(wms|ows)\/?$/, "/rest/styles");
            }
            if (this.sameOriginStyling) {
                // this could be made more robust
                // for now, only style for sources with relative url
                editableStyles = url.charAt(0) === "/";
                // and assume that local sources are GeoServer instances with
                // styling capabilities
                if (this.target.authenticate && editableStyles) {
                    // we'll do on-demand authentication when the button is
                    // pressed.
                    this.launchAction.enable();
                    return;
                }
            } else {
                editableStyles = true;
            }
            if (editableStyles) {
                if (this.target.isAuthorized()) {
                    // check if service is available
                    this.enableActionIfAvailable(url);
                }
            }
        }
    },
    
    /** private: method[enableActionIfAvailable]
     *  :arg url: ``String`` URL of style service
     * 
     *  Enable the launch action if the service is available.
     */
    enableActionIfAvailable: function(url) {
        Ext.Ajax.request({
            method: "PUT",
            url: url,
            callback: function(options, success, response) {
                // we expect a 405 error code here if we are dealing
                // with GeoServer and have write access.
                // var disabled = (response.status !== 405 
                //         && response.status !== 401); // 401 is proxy result not logged
                // write access avalaible
                var disabled = (response.status !== 200);
                this.launchAction.setDisabled(disabled); 
            },
            scope: this
        });
    },
    
    addOutput: function(config) {
        config = config || {};
        var record = this.target.selectedLayer;

        var origCfg = this.initialConfig.outputConfig || {};
        this.outputConfig.title = origCfg.title ||
            this.menuText + ": " + record.get("title");
        this.outputConfig.shortTitle = record.get("title");

        record = this.repairRecord(record);

        // TODO: Inheritance of target between WMSStyleDialog, RulePanel... PointSymbolizerMod
        Viewer.PointSymbolizerMod.prototype.defaultRestUrl = this.target.defaultRestUrl;

        Ext.apply(config, gxp.WMSStylesDialog.createGeoServerStylerConfig(record));
        if (this.rasterStyling === true) {
            config.plugins.push({
                ptype: "gxp_wmsrasterstylesdialog"
            });
        }
        Ext.applyIf(config, {style: "padding: 10px"});
        
        var output = gxp.plugins.Styler.superclass.addOutput.call(this, config);
        if (!(output.ownerCt.ownerCt instanceof Ext.Window)) {
            output.dialogCls = Ext.Panel;
            output.showDlg = function(dlg) {
                dlg.layout = "fit";
                dlg.autoHeight = false;
                output.ownerCt.add(dlg);
            };
        }
        output.stylesStore.on("load", function() {
            if (!this.outputTarget && output.ownerCt.ownerCt instanceof Ext.Window) {
                output.ownerCt.ownerCt.center();
            }
        });
    },

    repairRecord: function(record){
        var layerName = record.get("name");
        if(!layerName 
                && !!record.get('layer') 
                && !!record.get('layer').name){
            record.set('name', record.get('layer').name);
        }
        return record;
    }
        
});

Ext.preg(Viewer.plugins.Styler.prototype.ptype, Viewer.plugins.Styler);
