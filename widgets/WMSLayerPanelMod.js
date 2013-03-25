/**
 * Copyright (c) 2008-2011 The Open Planning Project
 * 
 * Published under the GPL license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

//TODO remove the WMSStylesDialog and GeoServerStyleWriter includes
/**
 * @include widgets/WMSStylesDialog.js
 * @include plugins/GeoServerStyleWriter.js
 * @include GeoExt/widgets/LayerOpacitySlider.js
 * @require OpenLayers/Format/CQL.js
 * @require widgets/FilterBuilder.js
 */

/** api: (define)
 *  module = gxp
 *  class = WMSLayerPanel
 *  base_link = `Ext.TabPanel <http://extjs.com/deploy/dev/docs/?class=Ext.TabPanel>`_
 */
Ext.namespace("Viewer.widgets");

/** api: constructor
 *  .. class:: WMSLayerPanel(config)
 *   
 *      Create a dialog for setting WMS layer properties like title, abstract,
 *      opacity, transparency and image format.
 */
Viewer.widgets.WMSLayerPanelMod = Ext.extend(gxp.WMSLayerPanel, {

    /** i18n **/
    notLoggedSaveTitleText: "Not logged",
    notLoggedSaveText: "Needed login for this function",

    constructor: function(config) {

        Ext.apply(this,config);

        Viewer.widgets.WMSLayerPanelMod.superclass.constructor.call(this, config);
    },

    initComponent: function() {

        Viewer.widgets.WMSLayerPanelMod.superclass.initComponent.call(this);
        // not needed //this.add(this.createSavePanel());
    },

    /** private: method[createSavePanel]
     *  :arg url: ``String`` url to save styles to
     *
     *  Creates the Styles panel.
     */
    createSavePanel: function() {
        var savePanel = null;

        if(this.target.isAuthorized()){
            var savePanel = new Viewer.widgets.SaveLayerPanel({
                layerRecord: this.layerRecord,
                authorized: this.authorized,
                target: this.target
            });
        }else{
            savePanel = {
                title: this.notLoggedSaveTitleText,
                html: this.notLoggedSaveText, 
                disabled: true
            };
        }
        return savePanel;
    },

    /** private: method[createStylesPanel]
     *  :arg url: ``String`` url to save styles to
     *
     *  Creates the Styles panel.
     */
    createStylesPanel: function(url) {
        var config = gxp.WMSStylesDialog.createGeoServerStylerConfig(
            this.layerRecord, url
        );
        
        if (this.rasterStyling === true) {
            config.plugins.push({
                ptype: "gxp_wmsrasterstylesdialog"
            });
        }
        var ownerCt = this.ownerCt;
        if (!(ownerCt.ownerCt instanceof Ext.Window)) {
            config.dialogCls = Ext.Panel;
            config.showDlg = function(dlg) {
                dlg.layout = "fit";
                dlg.autoHeight = false;
                ownerCt.add(dlg);
            };
        }
        return Ext.apply(config, {
            title: this.stylesText,
            style: "padding: 10px",
            editable: false
        });
    }
});

Ext.reg('gxp_wmslayerpanel', Viewer.widgets.WMSLayerPanelMod); 
