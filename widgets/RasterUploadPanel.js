/**
 * Copyright (C) 2012
 *
 * This file is part of the project ohiggins
 *
 * This software is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation; either version 2 of the License, or (at your option) any
 * later version.
 *
 * This software is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this library; if not, write to the Free Software Foundation, Inc., 51
 * Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 *
 * As a special exception, if you link this library with other files to produce
 * an executable, this library does not by itself cause the resulting executable
 * to be covered by the GNU General Public License. This exception does not
 * however invalidate any other reasons why the executable file might be covered
 * by the GNU General Public License.
 *
 * Author: Moisés Arcos Santiago <marcos@emergya.com>
 */

/** api: (define)
 *  module = Viewer.plugins
 *  class = RasterUploadPanel
 *  base_link = `Ext.FormPanel <http://extjs.com/deploy/dev/docs/?class=Ext.FormPanel>`_
 */
Ext.namespace('Viewer.plugins');

/** api: constructor
 *  .. class:: RasterUploadPanel(config)
 *
 *      A panel for uploading new layer data to GeoServer.
 */
Viewer.plugins.RasterUploadPanel = Ext.extend(Ext.Window, {
    xtype: 'gxp_rasteruploadpanel',

    /** i18n */
    windowTitleText: 'Create a new layer from raster file',
    fileTypeLabelText: 'Type of File',
    fileTypeEmptyText: 'Choose a file type',
    descriptionText: 'Select a geoTIFF file or a ZIP file with an image and a world file.',
    buttonText: 'Upload',
    layerNameLabelText: 'Title',
    layerNameEmptyText: 'Layer title',
    fileLabelText: 'Raster file',
    fileEmptyText: 'Browse for raster file...',
    chooseFileText: 'Browse',
    createLayerWaitMsgText: 'Uploading your file. Please wait',
    createLayerWaitMsgTitleText: 'File Upload',
    errorMsgTitle: 'Error',
    errorMsg: 'There was an error ocurred to send the data to the server',
    invalidFileExtensionText: 'File extension must be one of: ',
    crsLabel: 'CRS',
    crsTooltipText: 'Coordinate Reference System',
    crsEmptyText: 'Coordinate Reference System ID',
    invalidCrsText: 'CRS identifier should be an EPSG code (e.g. EPSG:4326)',
    fileTypeSelected: null,
    layerTypeId: null,
    layerResourceId: null,



    /** api: config[validFileExtensions]
     *  ``Array``
     *  List of valid file extensions.  These will be used in validating the
     *  file input value.  Default is ``[".zip", ".tif", ".tiff", ".gz", ".tar.bz2",
     *  ".tar", ".tgz", ".tbz2"]``.
     */
    validFileExtensions: {
        GEOTIFF: ['.tiff', '.tif'],
        IMAGE_WORLD: ['.zip'],
        IMAGE_MOSAIC: ['.zip'],
        ALL: ['.tiff', '.tif', '.zip']
    },

    /** private: method[initComponent]
     */
    initComponent: function() {
        var me = this;
        this.self = me;

        var defaultOptions = {
            title: this.windowTitleText,
            width: 400,
            height: 330,
            boxMaxHeight: 400,
            layout: 'card',
            autoScroll: true,
            activeItem: 0,
            bodyStyle: 'padding:10px',
            defaults: {
                // applied to each contained panel
                border: false
            },
            bbar: [
                '->', // greedy spacer so that the buttons are aligned to each side
                {
                    id: 'move-next',
                    text: this.buttonText,
                    handler: this.navHandler.createDelegate(this, [1])
                }
            ],
            items: [
                {
                    xtype: 'form',
                    id: 'uploadRasterForm',
                    fileUpload: true,
                    frame: true,
                    autoHeight: true,
                    height: 200,
                    labelWidth: 100,
                    defaults: {
                        anchor: '100%',
                        allowBlank: false,
                        msgTarget: 'side'
                    },
                    items: [
                        {
                            xtype: 'label',
                            cls: 'toolDescription',
                            text: this.descriptionText
                        }, {
                            xtype: 'combo',
                            id: 'fileType',
                            name: 'fileTypeVisible',
                            hiddenName: 'fileType',
                            allowBlank: false,
                            forceSelection: true,
                            fieldLabel: this.fileTypeLabelText,
                            store: [
                                ['GEOTIFF', 'GeoTIFF'],
                                ['IMAGE_WORLD', 'Image World'],
                                ['IMAGE_MOSAIC', 'Mosaico']
                            ],
                            autoSelect: true,
                            editable: false,
                            emptyText: this.fileTypeEmptyText,
                            triggerAction: 'all',
                            listeners: {
                                select: {
                                    fn: function(combo, record, index) {
                                        this.fileTypeSelected = record.data.field1;

                                    },
                                    scope: this
                                }
                            }



                        },
                        {
                            xtype: 'textfield',
                            id: 'name',
                            emptyText: this.layerNameEmptyText,
                            name: 'name',
                            fieldLabel: this.layerNameLabelText
                        }, {
                            xtype: 'combo',
                            name: 'nativeCRSVisible',
                            hiddenName: 'nativeCRS',
                            fieldLabel: this.crsLabel,
                            emptyText: this.crsEmptyText,
                            allowBlank: false,
                            regex: /^epsg:\d+$/i,
                            regexText: this.invalidCrsText,
                            typeAhead: true,
                            triggerAction: 'all',
                            value: 'EPSG:32719',
                            store: [
                                'EPSG:32719',
                                'EPSG:32718',
                                'EPSG:4326'
                            ],
                            listeners: {
                                afterrender: {
                                    fn: function(field) {
                                        Ext.QuickTips.register({
                                             dismissDelay: 10000,
                                            target: field.label.dom,
                                            text: this.crsTooltipText
                                        });    
                                        field.label.dom.style.cursor = 'help';
                                    },
                                    scope: this 
                                }
                            }
                        }, {
                            xtype: 'fileuploadfield',
                            id: 'file',
                            anchor: '90%',
                            emptyText: this.fileEmptyText,
                            fieldLabel: this.fileLabel,
                            name: 'file',
                            buttonText: '',
                            buttonCfg: {
                                iconCls: 'gxp-icon-filebrowse'
                            },
                            listeners: {
                                'fileselected': function(cmp, value) {
                                    // remove the path from the filename - avoids C:/fakepath etc.
                                    cmp.setValue(value.substring(value.lastIndexOf('/') + 1, value.length));
                                }
                            },
                            validator: this.fileNameValidator.createDelegate(this)
                        }
                    ]
                }
            ]
        };

        Ext.apply(me, defaultOptions);

        Viewer.plugins.RasterUploadPanel.superclass.initComponent.apply(me, arguments);

    },

    /** private: method[fileNameValidator]
     *  :arg name: ``String`` The chosen filename.
     *  :returns: ``Boolean | String``  True if valid, message otherwise.
     */
    fileNameValidator: function(name) {
        var valid = false;
        var ext;
        var vfeIndex = this.fileTypeSelected || 'ALL';
        if (this.fileTypeSelected !== null) {
           var validFileExt = this.validFileExtensions[this.fileTypeSelected];
            for (var i = 0, ii = validFileExt.length; i < ii; ++i) {
                ext = validFileExt[i];
                if (name.slice(-ext.length).toLowerCase() === ext) {
                    valid = true;
                    break;
                }
            }

        }
        return valid || (this.invalidFileExtensionText + '<br/>' + this.validFileExtensions[vfeIndex].join(', '));
    },

    navHandler: function() {
        var fp = this.items.get(0);
        if (fp.getForm().isValid()) {
            fp.getForm().submit({
                scope: this,
                url: '../../uploadRasterFile',
                waitMsg: this.createLayerWaitMsgText,
                waitTitle: this.createLayerWaitMsgTitleText,
                success: function(fp, o) {
                    var resp = Ext.util.JSON.decode(o.response.responseText);
                    if (resp && resp.success && resp.data && resp.data.status === 'success') {
                        //Add layer to map and close window
                        var layerName = resp.data.layerName;
                        var layerTitle = resp.data.layerTitle;
                        var geoserverUrl = (resp.data.serverUrl) || (app.sources.local.url + '/wms');
                        var layer = new OpenLayers.Layer.WMS(layerTitle,
                            geoserverUrl,
                            {
                                layers: layerName,
                                transparent: true
                            },{
                                opacity: 1,
                                visibility: true
                            });
                        layer.metadata.layerResourceId = resp.data.layerResourceId;
                        layer.metadata.layerTypeId = resp.data.layerTypeId;
                        layer.metadata.temporal = true;
                        Viewer.getMapPanel().map.addLayer(layer);
                        this.close();
                        Ext.Msg.alert('Capa creada', 'La capa se ha creado de forma temporal');
                    } else if (resp && resp.success && resp.data && resp.data.status === 'error') {
                        Ext.Msg.alert('Error', resp.data.message);
                    } else {
                        Ext.Msg.alert('Error', 'Se ha producido un error creando la capa.');
                    }
                },
                failure: function(form, action) {
                    Ext.Msg.alert(this.errorMsgTitle, this.errorMsg);
                }
            });
        }
    }
});

/** api: xtype = gxp_rasteruploadpanel */
Ext.reg(Viewer.plugins.RasterUploadPanel.prototype.xtype, Viewer.plugins.RasterUploadPanel);
