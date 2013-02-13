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
Ext.namespace("Viewer.plugins");

/** api: constructor
 *  .. class:: RasterUploadPanel(config)
 *   
 *      A panel for uploading new layer data to GeoServer.
 */
Viewer.plugins.RasterUploadPanel = Ext.extend(gxp.LayerUploadPanel, {
    
    /** i18n */
    titleLabel: "Title",
    titleEmptyText: "Layer title",
    abstractLabel: "Description",
    abstractEmptyText: "Layer description",
    fileLabel: "Raster",
    fieldEmptyText: "Browse for raster file...",
    uploadText: "Upload",
    waitMsgText: "Uploading your layer...",
    invalidFileExtensionText: "File extension must be one of: ",
    crsLabel: "CRS",
    crsEmptyText: "Coordinate Reference System ID",
    invalidCrsText: "CRS identifier should be an EPSG code (e.g. EPSG:4326)",   
    
    /** private: method[constructor]
     */
    constructor: function(config) {
        // Allow for a custom method to handle upload responses.
        config.errorReader = {
            read: config.handleUploadResponse || this.handleUploadResponse.createDelegate(this)
        };
        Viewer.plugins.RasterUploadPanel.superclass.constructor.call(this, config);
    },

    /** private: method[initComponent]
     */
    initComponent: function() {
        
        this.items = [{
            xtype: "textfield",
            name: "title",
            fieldLabel: this.titleLabel,
            emptyText: this.titleEmptyText,
            allowBlank: true
        }, {
            xtype: "textarea",
            name: "abstract",
            fieldLabel: this.abstractLabel,
            emptyText: this.abstractEmptyText,
            allowBlank: true
        }, {
            xtype: "fileuploadfield",
            id: "file",
            anchor: "95%",
            emptyText: this.fieldEmptyText,
            fieldLabel: this.fileLabel,
            name: "file",
            buttonText: "",
            buttonCfg: {
                iconCls: "gxp-icon-filebrowse"
            },
            listeners: {
                "fileselected": function(cmp, value) {
                    // remove the path from the filename - avoids C:/fakepath etc.
                    cmp.setValue(value.split(/[/\\]/).pop());
                }
            },
            validator: this.fileNameValidator.createDelegate(this)
        },{
            xtype: "textfield",
            name: "nativeCRS",
            fieldLabel: this.crsLabel,
            emptyText: this.crsEmptyText,
            allowBlank: true,
            regex: /^epsg:\d+$/i,
            regexText: this.invalidCrsText
        }];
        
        this.buttons = [{
            text: this.uploadText,
            handler: function() {
                var form = this.getForm();
                if (form.isValid()) {
                    var fields = form.getFieldValues(),
                        jsonData = {
                            'import': {}
                        };
                    jsonData["import"].targetWorkspace = {
                        workspace: {
                            // workspace name from the session
                            name: "capas_raster"
                        }
                    };
                    Ext.Ajax.request({
                        url: this.getUploadUrl(),
                        method: "POST",
                        jsonData: jsonData,
                        success: function(response) {
                            this._import = response.getResponseHeader("Location");
                            this.optionsFieldset.expand();
                            form.submit({
                                url: this._import + "/tasks",
                                waitMsg: this.waitMsgText,
                                waitMsgTarget: true,
                                reset: true,
                                scope: this
                            });
                        },
                        scope: this
                    });
                }
            },
            scope: this
        }];
        
        this.addEvents(
            /**
             * Event: uploadcomplete
             * Fires upon successful upload.
             *
             * Listener arguments:
             * panel - {<gxp.RasterUploadPanel} This form panel.
             * details - {Object} An object with an "import" property,
             *     representing a summary of the import result as provided by
             *     GeoServer's Importer API.
             */
            "uploadcomplete"
        );
        
        //this.getDefaultDataStore('default');

        gxp.LayerUploadPanel.superclass.initComponent.call(this);

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
        // Gets the geoserver url and prepare the path
        var urlGeoserver = app.sources.local.url;
        var indexOfOWS = urlGeoserver.indexOf("ows");
        if(indexOfOWS > 0){
            urlGeoserver = urlGeoserver.substr(0, indexOfOWS);
        }
        var urlMethods = "rest/imports";
        return app.proxy + urlGeoserver + urlMethods;
    },
    
    /** private: method[getWorkspacesUrl]
     */
    getWorkspacesUrl: function() {
        return this.url + "/workspaces.json";
    },
    
    /** private: method[handleUploadResponse]
     *  TODO: if response includes errors object, this can be removed
     *  Though it should only be removed if the server always returns text/html!
     */
    handleUploadResponse: function(response) {
        var obj = this.parseResponseText(response.responseText),
            records, tasks, task, msg, i,
            success = true;
        if (obj) {
            if (typeof obj === "string") {
                success = false;
                msg = obj;
            } else {
                tasks = obj.tasks || [obj.task];
                if (tasks.length === 0) {
                    success = false;
                    msg = "Upload contains no suitable files.";
                } else {
                    for (i=tasks.length-1; i>=0; --i) {
                        task = tasks[i];
                        if (!task) {
                            success = false;
                            msg = "Unknown upload error";
                            break;
                        } else if (task.state !== "READY") {
                            success = false;
                            msg = "Source " + task.source.file + " is " + task.state;
                            break;
                        }
                    }
                }
            }
        }
        if (!success) {
            // mark the file field as invlid
            records = [{data: {id: "file", msg: msg}}];
        } else {
            var formData = this.getForm().getFieldValues(),
                // for now we only support a single item (items[0])
                resource = task.items[0].resource,
                itemModified = !!(formData.title || formData["abstract"] || formData.nativeCRS),
                queue = [];
            if (itemModified) {
                var layer = resource.featureType ? "featureType" : "coverage",
                    item = {resource: {}};
                item.resource[layer] = {
                    title: formData.title || undefined,
                    "abstract": formData["abstract"] || undefined,
                    nativeCRS: formData.nativeCRS || undefined
                };
                Ext.Ajax.request({
                    method: "PUT",
                    url: tasks[0].items[0].href,
                    jsonData: {item: item},
                    callback: this.finishUpload,
                    scope: this
                });
            } else {
                this.finishUpload();
            }
        }
        return {success: success, records: records};
    },
    
    finishUpload: function() {
        Ext.Ajax.request({
            method: "POST",
            url: this._import,
            //TODO error handling
            success: this.handleUploadSuccess,
            scope: this
        });
    },
    
    /** private: parseResponseText
     *  :arg text: ``String``
     *  :returns:  ``Object``
     *
     *  Parse the response text.  Assuming a JSON string but allowing for a 
     *  string wrapped in a <pre> element (given non text/html response type).
     */
    parseResponseText: function(text) {
        var obj;
        try {
            obj = Ext.decode(text);
        } catch (err) {
            // if response type was text/plain, the text will be wrapped in a <pre>
            var match = text.match(/^\s*<pre[^>]*>(.*)<\/pre>\s*/);
            if (match) {
                try {
                    obj = Ext.decode(match[1]);
                } catch (err) {
                    obj = match[1];
                }
            }
        }
        return obj;
    },
    
    /** private: method[handleUploadSuccess]
     */
    handleUploadSuccess: function(response) {
        Ext.Ajax.request({
            method: "GET",
            url: this._import,
            success: function(response) {
                var details = Ext.decode(response.responseText);
                this.fireEvent("uploadcomplete", this, details);
                delete this._import;
            },
            scope: this
        });
    }

});

/** api: xtype = gxp_layeruploadpanel */
Ext.reg("gxp_layeruploadpanel", gxp.LayerUploadPanel);
