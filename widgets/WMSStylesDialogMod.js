/**
 * Copyright (c) 2008-2011 The Open Planning Project
 * 
 * Published under the GPL license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

/**
 * @require widgets/WMSStylesDialog.js

/** api: (define)
 *  module = Viewer.plugins
 *  class = WMSStylesDialogMod
 */
Ext.namespace("Viewer.plugins");

/** api: constructor
 *  .. class:: WMSStylesDialog(config)
 *   
 *      Create a dialog for selecting and layer styles. If the WMS supports
 *      GetStyles, styles can also be edited. The dialog does not provide any
 *      means of writing modified styles back to the server. To save styles,
 *      configure the dialog with a :class:`gxp.plugins.StyleWriter` plugin
 *      and call the ``saveStyles`` method.
 *
 *      Note: when this component is included in a build,
 *      ``OpenLayers.Renderer.defaultSymbolizer`` will be set to the SLD
 *      defaults.  In addition, the OpenLayers SLD v1 parser will be patched
 *      to support vendor specific extensions added to SLD by GeoTools.
 */
Viewer.plugins.WMSStylesDialogMod = Ext.extend(gxp.WMSStylesDialog, {

    /** i18n **/
    updateDefaultStyleText: 'Set default',
    updateDefaultTip: 'Set default style when the layer is served',

    /** private: method[initComponent]
     */
    initComponent: function() {
        this.addEvents(
            /** api: event[ready]
             *  Fires when this component is ready for user interaction.
             */
            "ready",
            
            /** api: event[modified]
             *  Fires on every style modification.
             *
             *  Listener arguments:
             *
             *  * :class:`gxp.WMSStylesDialog` this component
             *  * ``String`` the name of the modified style
             */
            "modified",
            
            /** api: event[styleselected]
             *  Fires whenever an existing style is selected from this dialog's
             *  Style combo box.
             *  
             *  Listener arguments:
             *
             *  * :class:`gxp.WMSStylesDialog` this component
             *  * ``String`` the name of the selected style
             */
            "styleselected",
            
            /** api: event[beforesaved]
             *  Fires before the styles are saved (using a
             *  :class:`gxp.plugins.StyleWriter` plugin)
             *
             *  Listener arguments:
             *
             *  * :class:`gxp.WMSStylesDialog` this component
             *  * ``Object`` options for the ``write`` method of the
             *    :class:`gxp.plugins.StyleWriter`
             */
            "beforesaved",
            
            /** api: event[saved]
             *  Fires when a style was successfully saved. Applications should
             *  listen for this event and redraw layers with the currently
             *  selected style.
             *
             *  Listener arguments:
             *
             *  * :class:`gxp.WMSStylesDialog` this component
             *  * ``String`` the name of the currently selected style
             */
            "saved"            
        );

        var defConfig = {
            layout: "form",
            disabled: true,
            items: [{
                xtype: "fieldset",
                title: this.stylesFieldsetTitle,
                labelWidth: 85,
                style: "margin-bottom: 0;"
            }, {
                xtype: "toolbar",
                style: "border-width: 0 1px 1px 1px; margin-bottom: 10px;",
                items: [
                    {
                        xtype: "button",
                        iconCls: "add",
                        text: this.addStyleText,
                        tooltip: this.addStyleTip,
                        handler: this.addStyle,
                        scope: this
                    }, {
                        xtype: "button",
                        iconCls: "delete",
                        text: this.deleteStyleText,
                        tooltip: this.deleteStyleTip,
                        handler: function() {
                            this.stylesStore.remove(this.selectedStyle);
                        },
                        scope: this
                    }, {
                        xtype: "button",
                        iconCls: "updateDefault",
                        text: this.updateDefaultStyleText,
                        tooltip: this.updateDefaultTip,
                        handler: function() {
                            this.updateDefault(this.selectedStyle);
                        },
                        scope: this
                    }, {
                        xtype: "button",
                        iconCls: "edit",
                        text: this.editStyleText,
                        tooltip: this.editStyleTip,
                        handler: function() {
                            this.editStyle();
                        },
                        scope: this
                    }, {
                        xtype: "button",
                        iconCls: "duplicate",
                        text: this.duplicateStyleText,
                        tooltip: this.duplicateStyleTip,
                        handler: function() {
                            var prevStyle = this.selectedStyle;
                            var newStyle = prevStyle.get(
                                "userStyle").clone();
                            newStyle.isDefault = false;
                            newStyle.name = this.newStyleName();
                            var store = this.stylesStore;
                            store.add(new store.recordType({
                                "name": newStyle.name,
                                "title": newStyle.title,
                                "abstract": newStyle.description,
                                "userStyle": newStyle
                            }));
                            this.editStyle(prevStyle);
                        },
                        scope: this
                    }
                ]
            }]
        };
        Ext.applyIf(this, defConfig);
        
        this.createStylesStore();
                        
        this.on({
            "beforesaved": function() { this._saving = true; },
            "saved": function() { delete this._saving; },
            "savefailed": function() { 
                Ext.Msg.show({
                    title: this.errorTitle,
                    msg: this.errorMsg,
                    icon: Ext.MessageBox.ERROR,
                    buttons: {ok: true}
                });
                delete this._saving; 
            },
            "render": function() {
                gxp.util.dispatch([this.getStyles], function() {
                    this.enable();
                }, this);
            },
            scope: this
        });

        gxp.WMSStylesDialog.superclass.initComponent.apply(this, arguments);
    },
    
    /** api: method[updateDefault]
     *  Saves default style of the layer with the selected style
     */
    updateDefault: function(options){
        if(!!this.selectedStyle
                && !!this.plugins[0]
                && !!this.plugins[0].assignStyles){

            var options = options || {};
            var selectedStyle = this.selectedStyle.get('name');
            var stylesStore = this.stylesStore;

            var saveStylePlugin = this.plugins[0];
            var success = function() {
                // we don't need any callbacks for deleting styles.
                saveStylePlugin.deleteStyles();
                var modified = saveStylePlugin.target.stylesStore.getModifiedRecords();
                for (var i=modified.length-1; i>=0; --i) {
                    // mark saved
                    modified[i].phantom = false;
                }
                var target = saveStylePlugin.target;
                stylesStore.commitChanges();
                options.success && options.success.call(options.scope);
                target.fireEvent("saved", saveStylePlugin, selectedStyle);
            };
            saveStylePlugin.assignStyles(selectedStyle, success);
        }
    }

});

/** api: function[createGeoServerStylerConfig]
 *  :arg layerRecord: ``GeoExt.data.LayerRecord`` Layer record to configure the
 *      dialog for.
 *  :arg url: ``String`` Optional. Custaom URL for the GeoServer REST endpoint
 *      for writing styles.
 *
 *  Creates a configuration object for a :class:`gxp.WMSStylesDialog` with a
 *  :class:`gxp.plugins.GeoServerStyleWriter` plugin and listeners for the
 *  "styleselected", "modified" and "saved" events that take care of saving
 *  styles and keeping the layer view updated.
 */
gxp.WMSStylesDialog.createGeoServerStylerConfig = function(layerRecord, url, persistenceGeoContext) {
    var layer = layerRecord.getLayer();
    if (!url) {
        url = layerRecord.get("restUrl");
    }
    if (!url) {
        url = layer.url.split("?").shift().replace(/\/(wms|ows)\/?$/, "/rest");
    }

    // Cleaning url for call to rest API
    // ovewrite url with app.proxy
    if(url.indexOf(app.proxy) < 0){
        url = app.proxy + url;
    }
    // delete '/ows/' from URL
    if(url.indexOf("/ows/") > -1){
        url = url.replace("/ows/", "/");
    }

    var plugins = [];

    if(!!persistenceGeoContext 
            && persistenceGeoContext.isOwner(layer)){
        plugins.push({
            ptype: "gxp_geoserverstylewriter",
            baseUrl: url
        });
    }

    return {
        xtype: "gxp_wmsstylesdialog",
        layerRecord: layerRecord,
        plugins: plugins,
        listeners: {
            "styleselected": function(cmp, style) {
                layer.mergeNewParams({
                    styles: style
                });
            },
            "modified": function(cmp, style) {
                cmp.saveStyles();
            },
            "saved": function(cmp, style) {
                layer.mergeNewParams({
                    _olSalt: Math.random(),
                    styles: style
                });
            },
            scope: this
        }
    };
};

/** api: xtype = gxp_wmsstylesdialog */
Ext.reg('gxp_wmsstylesdialog', Viewer.plugins.WMSStylesDialogMod);
