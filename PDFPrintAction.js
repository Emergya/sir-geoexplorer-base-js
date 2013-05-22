/**
 * Copyright (C) 2013
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
 * Author: Luis Román <lroman@emergya.com>
 */

/**
 * @requires plugins/Tool.js
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = PDFPrintAction
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("gxp.plugins");

/** api: constructor
 *  .. class:: pointInformationAction(config)
 *
 *    Provides an action for showing channel selector dialog.
 */
gxp.plugins.PDFPrintAction = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = gxp_extendedtoolbar */
    ptype: "gxp_pdfprint",
    
    /** i18n * */
    /** api: config[buttonText]
     *  ``String`` Text to show button
     */
    buttonText: 'Print',
     
    /** api: config[menuText]
     *  ``String``
     *  Text for show in menu item (i18n).
     */
    menuText: 'Print',
    errorText:"An error was found. Please try again later.",

   
    /** api: config[tooltip]
     *  ``String``
     *  Text for channel tool tooltip (i18n).
     */
    tooltip: 'Print',
    
    /** private: property[iconCls]
     */
    iconCls: 'gxp-icon-print',

    /** public: property[toggleGroup]*/
    toggleGroup: null,
    
    /** private: method[constructor]
     */
    constructor: function(config) {
        gxp.plugins.PDFPrintAction.superclass.constructor.apply(this, arguments);
    },

    /** private: method[init]
     * :arg target: ``Object`` The object initializing this plugin.
     */
    init: function(target) {
        gxp.plugins.PDFPrintAction.superclass.init.apply(this, arguments);
        this.target.on('beforerender', this.addActions, this);
    },

    /** api: method[addActions]
     */
    addActions: function() {

        var actions =  gxp.plugins.PDFPrintAction.superclass.addActions.apply(this, [{
            buttonText: this.showButtonText ? this.buttonText : '',
            menuText: this.menuText,
            iconCls: this.iconCls,
            tooltip: this.tooltip,
            enableToggle: true,
            allowDepress: true,
            toggleGroup: this.toggleGroup,
            deactivateOnDisable: true,
            disabled:true,
            handler: function() {
                var ds = Viewer.getComponent('PDFPrintWindow');
                if (ds === undefined) {

                    var printProvider = new GeoExt.data.PrintProvider({
                        url : app.sources.local.url.replace("ows","pdf"),
                        listeners: {
                            scope: this,
                            loadcapabilities : function() {
                                Ext.MessageBox.updateProgress(1);
                                Ext.MessageBox.hide();
                                // We modifiy the service urls so they actually work.
                                printProvider.capabilities.createURL = app.sources.local.url.replace("ows","pdf/create.json");
                                printProvider.capabilities.printURL = app.sources.local.url.replace("ows","pdf/print.pdf");

                                ds = new Viewer.dialog.PDFPrintWindow({
                                    persistenceGeoContext: this.target.persistenceGeoContext,
                                    printProvider : printProvider,
                                    target: this.target,
                                    action: this
                                });
                                Viewer.registerComponent('PDFPrintWindow', ds);
                                ds.show();
                                  ds.on("hide", function() {
                                    // We deactivate the tool if we close the window.
                                    if(this.actions[0].items[0].pressed){
                                        this.actions[0].items[0].toggle();
                                    }
                                },this);
                            },

                            printexception : function(printProvider, response) {
                                Ext.MessageBox.updateProgress(1);
                                Ext.MessageBox.hide();
                                Ext.MessageBox.alert("",this.errorText);
                            },
                            beforedownload : function(provider, mapPDFUrl) {
                                 // Generation of the pdf succesfull                         
                                var printWindow = Viewer.getComponent('PDFPrintWindow');
                                mapPDFUrl = app.sources.local.url.replace("ows","pdf")+mapPDFUrl.substr(mapPDFUrl.lastIndexOf("/"));
                                printWindow._mapPDFUrlRetrieved(mapPDFUrl);
                                return false;
                            }
                        }
                    });
                    printProvider.customParams.imageName = "";
                    Ext.Msg.wait("Por favor, espere...");
                    printProvider.loadCapabilities();
                } else {
                    if (ds.isVisible()) {
                        ds.hide();
                    } else {
                        ds.show();
                    }
                }
            },
            listeners : {
                toggle: function(button, pressed) {
                    var ds = Viewer.getComponent('PDFPrintWindow');
                    if (!pressed && ds) {
                        ds.hide();
                    }
                },
                scope: this
            },
            scope: this
        }]);

        this.target.on("ready", function() {
            actions[0].enable();
        }, this);

        return actions;
    }
});

Ext.preg(gxp.plugins.PDFPrintAction.prototype.ptype, gxp.plugins.PDFPrintAction);
