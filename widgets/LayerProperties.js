/**
 * Copyright (c) 2008-2011 The Open Planning Project
 * 
 * Published under the GPL license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

/**
 * @requires plugins.LayerProperties
 * @requires widgets.LayerPanel
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = LayerProperties
 */

/** api: (extends)
 *  plugins/LayerProperties.js
 */
Ext.namespace("Viewer.widgets");

/** api: constructor
 *  .. class:: LayerProperties(config)
 *
 *    Plugin for showing the properties of a selected layer from the map.
 */
Viewer.widgets.LayerProperties = Ext.extend(gxp.plugins.LayerProperties, {
    
    /** api: ptype = vw_layerproperties */
    ptype: "vw_layerproperties",

    authorizedActiveTab: 0,
    notAuthorizedActiveTab: 0,
        
    /** api: method[addActions]
     */
    addActions: function() {
        var actions = gxp.plugins.LayerProperties.superclass.addActions.apply(this, [{
            menuText: this.menuText,
            iconCls: "gxp-icon-layerproperties",
            disabled: true,
            tooltip: this.toolTip,
            handler: function() {
                this.removeOutput();
                this.addOutput();
            },
            scope: this
        }]);
        var layerPropertiesAction = actions[0];

        this.target.on("layerselectionchange", function(record) {

            var notWMS = (!record || !record.get("properties")) ;

            layerPropertiesAction.setDisabled(
                notWMS || !this.target.isAuthorized() 
            );
        }, this);
        return actions;
    },

    
    addOutput: function(config) {
        config = config || {};
        var record = this.target.selectedLayer;
        var origCfg = this.initialConfig.outputConfig || {};
        this.outputConfig.title = origCfg.title ||
            this.menuText + ": " + record.get("title");
        this.outputConfig.shortTitle = record.get("title");
        
        //TODO: if not wms layers could have properties
        // var default_xtype = this.target.isAuthorized() ? 
        //     "vw_layerpanel": "gxp_layerpanel";
        var default_xtype = "gxp_layerpanel";
        var xtype = record.get("properties") || default_xtype;
        var panelConfig = this.layerPanelConfig;
        if (panelConfig && panelConfig[xtype]) {
            Ext.apply(config, panelConfig[xtype]);
        }

        if(!this.target.isAuthorized()){
            config.activeTab = this.notAuthorizedActiveTab;
        }else{
            config.activeTab = this.authorizedActiveTab;
        }

        return gxp.plugins.LayerProperties.superclass.addOutput.call(this, Ext.apply({
            xtype: xtype,
            authorized: this.target.isAuthorized(),
            layerRecord: record,
            target: this.target,
            source: this.target.getSource(record),
            defaults: {
                style: "padding: 10px",
                autoHeight: this.outputConfig.autoHeight
            },
            listeners: {
                added: function(cmp) {
                    if (!this.outputTarget) {
                        cmp.on("afterrender", function() {
                            cmp.ownerCt.ownerCt.center();
                        }, this, {single: true});
                    }
                },
                scope: this
            }
        }, config));
    }
        
});

Ext.preg(Viewer.widgets.LayerProperties.prototype.ptype, Viewer.widgets.LayerProperties);
