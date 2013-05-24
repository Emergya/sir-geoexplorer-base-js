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

    /** api: config[checkUserInfo]
     *  ``Boolean``
     *  Check user logged info to active this tool
     */
    checkUserInfo: true,
    
    /** api: method[addActions]
     */
    addActions: function() {
        var layerProperties;
        var actions = gxp.plugins.Styler.superclass.addActions.apply(this, [{
            menuText: this.menuText,
            iconCls: "gxp-icon-palette",
            disabled: true,
            tooltip: this.tooltip,
            handler: function() {
                this.actionHandler();
            },
            scope: this
        }]);
        
        this.launchAction = actions[0];
        this.target.on({
            layerselectionchange: this.handleLayerChange,
            scope: this
        });
        
        return actions;
    },

    actionHandler: function(){
        //Not need always!!
        //this.target.doAuthorized(this.roles, this.addOutput, this);
        this.addOutput();
    },
    
    /** private: method[handleLayerChange]
     *  :arg record: ``GeoExt.data.LayerRecord``
     *
     *  Handle changes to the target viewer's selected layer.
     */
    handleLayerChange: function(record) {
        // first check if is disabled!!
        if(!this.checkIfDisable(record)){
            Viewer.plugins.Styler.superclass.handleLayerChange.apply(this, arguments);
            // #83263: Seems not be effect otherwise
            setTimeout(function(){
                app.tools.styler.launchAction.setDisabled(false);
            }, 1);
        }else{
            // #83263: Seems not be effect otherwise
            setTimeout(function(){
                app.tools.styler.launchAction.setDisabled(true);
            }, 1);
        }
    },

    /** private: method[checkIfDisable]
     *  :arg layerRec: ``GeoExt.data.LayerRecord``
     *
     *  Enable this.launchAction if the layer can be management by 
     *  the user logged or disable this.launchAction otherwise (if this.checkUserInfo flag is active)
     */
    checkIfDisable: function(record) {

        var disable = true;
        
        if(!!record){
            var layer = record.getLayer();
            var userInfo = app.persistenceGeoContext.userInfo;
            disable = false;
            
            if(layer.isBaseLayer){
                disable = true;
            }
            if(!disable && this.checkUserInfo){
                /*
                 * only postgis layers for no admin users:
                    sir-admin_db=> select * from gis_layer_type;
                     id |    name     |   tipo    
                    ----+-------------+-----------
                      1 | WMS         | Raster
                      2 | WFS         | Raster
                      3 | KML         | Raster
                      4 | WMS         | Vectorial
                      5 | WFS         | Vectorial
                      6 | KML         | Vectorial
                      7 | postgis     | Vectorial
                      8 | geotiff     | Raster
                      9 | imagemosaic | Raster
                     10 | imageworld  | Raster
                */
                disable = !app.persistenceGeoContext.isOwner(layer) 
                    || (userInfo.admin 
                        && (layer.metadata.layerTypeId != 7         // postgis layers
                            && layer.metadata.layerTypeId != 4))    // WMS layers
                    || (!userInfo.admin 
                        && (layer.metadata.layerTypeId != 7));      // postgis layers
            }
        }

        this.launchAction.setDisabled(disable); 

        return disable;
    },

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
        // first check if is disabled!!
        if(!this.checkIfDisable(record)){
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
        }
    },
    
    /** private: method[enableActionIfAvailable]
     *  :arg url: ``String`` URL of style service
     * 
     *  Enable the launch action if the service is available.
     */
    enableActionIfAvailable: function(url) {
        // ovewrite url with app.proxy
        if(url.indexOf(app.proxy) < 0){
            url = app.proxy + url;
        }
        Ext.Ajax.request({
            method: "PUT",
            url: url,
            callback: function(options, success, response) {
                this.launchAction.setDisabled(response.status !== 200); // 200 pproxy!!
            },
            scope: this
        });
    },
    
    addOutput: function(config) {
        config = config || {};
        var record = this.target.selectedLayer;

        var origCfg = this.initialConfig.outputConfig || {};
        this.outputConfig.title = this.menuText + ": " + record.get("title");
        this.outputConfig.shortTitle = record.get("title");

        record = this.repairRecord(record);

        // TODO: Inheritance of target between WMSStyleDialog, RulePanel... PointSymbolizerMod
        Viewer.PointSymbolizerMod.prototype.defaultRestUrl = this.target.defaultRestUrl;

        Ext.apply(config, gxp.WMSStylesDialog.createGeoServerStylerConfig(record, null, this.target.persistenceGeoContext));
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
