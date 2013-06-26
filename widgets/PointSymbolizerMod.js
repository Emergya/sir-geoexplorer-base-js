/**
 * Copyright (c) 2008-2011 The Open Planning Project
 * 
 * Published under the GPL license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

/** 
 * @requires widgets/PointSymbolizer.js
 */
 
/** api: (define)
 *  module = Viewer
 *  class = PointSymbolizerMod
 *  base_link = `Ext.Panel <http://extjs.com/deploy/dev/docs/?class=Ext.Panel>`_
 */
Ext.namespace("Viewer");

/** api: constructor
 *  .. class:: PointSymbolizerMod(config)
 *   
 *      Form for configuring a point symbolizer.
 */
Viewer.PointSymbolizerMod = Ext.extend(gxp.PointSymbolizer, {

    /** api: config[symbolizer]
     *  ``Object``
     *  A symbolizer object that will be used to fill in form values.
     *  This object will be modified when values change.  Clone first if
     *  you do not want your symbolizer modified.
     */
    symbolizer: null,
    
    /** i18n */
    uploadFileEmptyText: 'Select a file...',
    uploadFileLabel: 'File',
    waitMsgText: 'Please wait...',
    
    /** api: config[validFileExtensions]
     *  ``Array``
     *  List of valid file extensions.  These will be used in validating the 
     *  file input value.  Default is ``[".png,.jpeg,.jpg"]``.
     */
    validFileExtensions: [".png", ".jpeg", ".jpg"],
    
    /** api: config[url]
     *  ``String``
     *  URL for upload temp file to persistencegeo.
     */
     url: "persistenceGeo/uploadResource",

    
    /** api: config[loadFileUrl]
     *  ``String``
     *  URL for load temp file to persistencegeo.
     */
    loadFileUrl: 'persistenceGeo/getResource/{0}',

    /** api: method[getLoadFileUrl]
     *  ``String``
     *  Return URL for load a temp file to persistencegeo.
     */
    getLoadFileUrl: function(idFile){
        var host = document.URL.substring(0,document.URL.indexOf(this.defaultRestUrl.replace("/rest", "")));
        return host + this.defaultRestUrl + '/' + String.format(this.loadFileUrl, idFile);
    },


    defaultRestUrl: null,

    initComponent: function() {

        this.target = Ext.getCmp('styler_component') ? Ext.getCmp('styler_component').target : null;
        
        if(!this.symbolizer) {
            this.symbolizer = {};
        }   
        
        if (!this.pointGraphics) {
            this.pointGraphics = [
                {display: this.graphicCircleText, value: "circle", mark: true},
                {display: this.graphicSquareText, value: "square", mark: true},
                {display: this.graphicTriangleText, value: "triangle", mark: true},
                {display: this.graphicStarText, value: "star", mark: true},
                {display: this.graphicCrossText, value: "cross", mark: true},
                {display: this.graphicXText, value: "x", mark: true},
                {display: this.graphicExternalText}
            ];
        }
        
        this.external = !!this.symbolizer["externalGraphic"];

        this.markPanel = new Ext.Panel({
            border: false,
            collapsed: this.external,
            layout: "form",
            items: [{
                xtype: "gxp_fillsymbolizer",
                symbolizer: this.symbolizer,
                labelWidth: this.labelWidth,
                labelAlign: this.labelAlign,
                colorManager: this.colorManager,
                listeners: {
                    change: function(symbolizer) {
                        this.fireEvent("change", this.symbolizer);
                    },
                    scope: this
                }
            }, {
                xtype: "gxp_strokesymbolizer",
                symbolizer: this.symbolizer,
                labelWidth: this.labelWidth,
                labelAlign: this.labelAlign,
                colorManager: this.colorManager,
                listeners: {
                    change: function(symbolizer) {
                        this.fireEvent("change", this.symbolizer);
                    },
                    scope: this
                }
            }]
        });
        
        this.urlField = new Ext.form.TextField({
            name: "url",
            fieldLabel: this.urlText,
            value: this.symbolizer["externalGraphic"],
            hidden: !this.external,
            listeners: {
                change: function(field, value) {
                    this.symbolizer["externalGraphic"] = value;
                    this.fireEvent("change", this.symbolizer);
                },
                scope: this
            },
            width: 100 // TODO: push this to css
        });
        
        this.graphicPanel = new Ext.Panel({
            border: false,
            collapsed: !this.external,
            layout: "form",
            items: [this.urlField, {
                xtype: "slider",
                name: "opacity",
                fieldLabel: this.opacityText,
                value: [(this.symbolizer["graphicOpacity"] == null) ? 100 : this.symbolizer["graphicOpacity"] * 100],
                isFormField: true,
                listeners: {
                    changecomplete: function(slider, value) {
                        this.symbolizer["graphicOpacity"] = value / 100;
                        this.fireEvent("change", this.symbolizer);
                    },
                    scope: this
                },
                plugins: [
                    new GeoExt.SliderTip({
                        getText: function(thumb) {
                            return thumb.value + "%";
                        }
                    })
                ],
                width: 100 // TODO: push this to css                
            }]
        });

        this.filePanel = new Ext.FormPanel({
            border: false,
            collapsed: false,
            //collapsed: !this.external,
            layout: "form",
            fileUpload: true,
            items: [{
                xtype: "fileuploadfield",
                id: "file",
                anchor: "90%",
                emptyText: this.uploadFileEmptyText,
                fieldLabel: this.uploadFileLabel,
                name: "uploadfile",
                buttonText: "",
                buttonCfg: {
                    iconCls: "gxp-icon-filebrowse"
                },
                listeners: {
                    "fileselected": function(cmp, value) {
                        // remove the path from the filename - avoids C:/fakepath etc.
                        //console.log(value);
                        //cmp.setValue(value.split(/[/\\]/).pop());
                        this.uploadIconFile();
                    }, 
                    scope: this
                },
                validator: this.fileNameValidator.createDelegate(this)
            }]
        });

        this.items = [{
            xtype: "combo",
            name: "mark",
            id: 'typeSymbol',
            fieldLabel: this.symbolText,
            store: new Ext.data.JsonStore({
                data: {root: this.pointGraphics},
                root: "root",
                fields: ["value", "display", "preview", {name: "mark", type: "boolean"}]
            }),
            value: this.external ? 0 : this.symbolizer["graphicName"],
            displayField: "display",
            valueField: "value",
            tpl: new Ext.XTemplate(
                '<tpl for=".">' +
                    '<div class="x-combo-list-item gx-pointsymbolizer-mark-item">' +
                    '<tpl if="preview">' +
                        '<img src="{preview}" alt="{display}"/>' +
                    '</tpl>' +
                    '<span>{display}</span>' +
                '</div></tpl>'
            ),
            mode: "local",
            allowBlank: false,
            triggerAction: "all",
            editable: false,
            listeners: {
                select: function(combo, record) {
                    this.selectSymbol(combo, record);
                },
                scope: this
            },
            width: 100 // TODO: push this to css
        }, 
        this.filePanel, {
            xtype: "textfield",
            name: "size",
            fieldLabel: this.sizeText,
            value: this.symbolizer["pointRadius"] && this.symbolizer["pointRadius"] * 2,
            listeners: {
                change: function(field, value) {
                    this.symbolizer["pointRadius"] = value / 2;
                    this.fireEvent("change", this.symbolizer);
                },
                scope: this
            },
            width: 100 // TODO: push this to css
        }, {
            xtype: "textfield",
            name: "rotation",
            fieldLabel: this.rotationText,
            value: this.symbolizer["rotation"],
            listeners: {
                change: function(field, value) {
                    this.symbolizer["rotation"] = value;
                    this.fireEvent("change", this.symbolizer);
                },
                scope: this
            },
            width: 100 // TODO: push this to css
        }, this.markPanel, this.graphicPanel
        ];

        this.addEvents(
            /**
             * Event: change
             * Fires before any field blurs if the field value has changed.
             *
             * Listener arguments:
             * symbolizer - {Object} A symbolizer with stroke related properties
             *     updated.
             */
            "change"
        ); 

        gxp.PointSymbolizer.superclass.initComponent.call(this);

    },

    selectSymbol: function (combo, record){
        var mark = record.get("mark");
        var value = record.get("value");
        if(!mark) {
            if(value) {
                this.urlField.hide();
                this.symbolizer["externalGraphic"] = value;
            } else {
                this.urlField.show();
            }

            if(!this.external) {
                this.external = true;
                var urlValue = this.urlField.getValue();
                if (!Ext.isEmpty(urlValue)) {
                    this.symbolizer["externalGraphic"] = urlValue;
                }
                delete this.symbolizer["graphicName"];
                this.updateGraphicDisplay();
            }
        } else {
            if(this.external) {
                this.external = false;
                delete this.symbolizer["externalGraphic"];
                this.updateGraphicDisplay();
            }
            this.symbolizer["graphicName"] = value;
        }
        try{
        this.fireEvent("change", this.symbolizer);
        }catch(e){
            // TODO: Handle this: The wms style mustn't be updated
        }
    },
    
    updateGraphicDisplay: function() {
        if(this.external) {
            this.markPanel.collapse();
            this.graphicPanel.expand();
        } else {
            this.graphicPanel.collapse();
            this.markPanel.expand();
        }
        // TODO: window shadow fails to sync
    },

    uploadIconFile: function (){
        var this_ = this;
        var form = this.filePanel.getForm();
        if (form.isValid()) {
            form.submit({
                url: this.getUploadUrl(),
                waitMsg: this.waitMsgText,
                waitMsgTarget: true,
                reset: true,
                success : function(form, action) {
                    try{
                        var json = Ext.decode(action.response.responseText);
                        var idFile = json.data;
                        if(!!json && !!json.data){
                            this_.idFile = json.data;
                            var typeSymbol = Ext.getCmp('typeSymbol');
                            typeSymbol.setValue(this_.graphicExternalText);
                            this_.selectSymbol(typeSymbol, typeSymbol.store.getAt(6));
                            var urlValue = this_.getLoadFileUrl(this_.idFile);
                            this_.urlField.setValue(urlValue);
                            typeSymbol.fireEvent('change', this_.urlField, urlValue);
                        }else{
                            //TODO: Show error
                            console.log('error uploading');
                        }
                    }catch(e){
                        //TODO: Show error
                        console.log('error uploading');
                    }
                },
                failure : function(form, action) {
                    //TODO: Show error
                    console.log('error uploading');
                }
            });
        }
    },
    
    /** private: method[fileNameValidator]
     *  :arg name: ``String`` The chosen filename.
     *  :returns: ``Boolean | String``  True if valid, message otherwise.
     */
    fileNameValidator: function(name) {
        var valid = false;
        var ext, len = name.length;
        for (var i=0, ii=this.validFileExtensions.length; i<ii; ++i) {
            ext = this.validFileExtensions[i];
            if (name.slice(-ext.length).toLowerCase() === ext) {
                valid = true;
                break;
            }
        }
        return valid || this.invalidFileExtensionText + '<br/>' + this.validFileExtensions.join(", ");
    },

    /** private: method[getUploadUrl]
     */
    getUploadUrl: function() {
        return this.defaultRestUrl + '/'  + this.url;
    }
        
});

/** api: xtype = gxp_pointsymbolizer */
Ext.reg('gxp_pointsymbolizer', Viewer.PointSymbolizerMod);
