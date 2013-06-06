/*
 * NewSourceDialog.js Copyright (C) 2013 This file is part of PersistenceGeo project
 *
 * This software is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 *
 * As a special exception, if you link this library with other files to
 * produce an executable, this library does not by itself cause the
 * resulting executable to be covered by the GNU General Public License.
 * This exception does not however invalidate any other reasons why the
 * executable file might be covered by the GNU General Public License.
 *
 * Authors: Alejandro Diaz Torres (mailto:adiaz@emergya.com)
 */

/** api: (define)
 *  module = PersistenceGeo.widgets
 *  class = NewSourceDialog
 */
Ext.namespace("PersistenceGeo.widgets");

/**
 * Class: PersistenceGeo.widgets.NewSourceDialog
 *
 * New source dialog for persistence geo
 *
 */
PersistenceGeo.widgets.NewSourceDialog = Ext.extend(gxp.NewSourceDialog, {

    /** i18n **/
    storeAndAddServerText: "Store server",
    storeAndAddServerTitleText: "Store server for all users of the platform",
    addServerText: "Add",
    addServerTitleText: "Add server only for this session",
    cancelTitleText: "Close this window",
    sourceNameTitleText: "Name",

    /** private: method[initComponent]
     *
     * Change panel if this.target.isAuthorizedIn("ROLE_ADMINISTRATOR")
     * to show source name and save in persistence geo
     */
    initComponent: function() {

        this.addEvents("urlselected", "urlsaved");

        this.urlTextField = new Ext.form.TextField({
            fieldLabel: "URL",
            allowBlank: false,
            width: 250,
            msgTarget: "under",
            validator: this.urlValidator.createDelegate(this),
            listeners: {
                specialkey: function(f, e) {
                    if (e.getKey() === e.ENTER) {
                        this.addServer();
                    }
                },
                scope: this
            }
        });

        var isAuthorized = this.target.isAuthorizedIn("ROLE_ADMINISTRATOR");

        this.nameTextField = new Ext.form.TextField({
            fieldLabel: this.sourceNameTitleText,
            allowBlank: false,
            width: 250,
            msgTarget: "under"
        });

        var items;
        if (isAuthorized) {
            items = [
                this.urlTextField,
                this.nameTextField
            ];
        } else {
            items = [
                this.urlTextField
            ];
        }

        this.form = new Ext.form.FormPanel({
            items: items,
            border: false,
            labelWidth: 50,
            bodyStyle: "padding: 15px",
            autoWidth: true,
            autoHeight: true,
            listeners: {
                afterrender: function() {
                    this.urlTextField.focus(false, true);
                },
                scope: this
            }
        });

        if (isAuthorized) {
            this.bbar = [
                new Ext.Toolbar.Fill(),
                new Ext.Button({
                    text: this.cancelText,
                    tooltip: this.cancelTitleText,
                    handler: this.hide,
                    scope: this
                }),
                new Ext.Button({
                    text: this.addServerText,
                    tooltip: this.addServerTitleText,
                    iconCls: "add",
                    handler: this.addServer,
                    scope: this
                }),
                new Ext.Button({
                    text: this.storeAndAddServerText,
                    tooltip: this.storeAndAddServerTitleText,
                    iconCls: "add",
                    handler: this.storeAndAddServer,
                    scope: this
                })
            ];
        } else {
            this.bbar = [
                new Ext.Toolbar.Fill(),
                new Ext.Button({
                    text: this.cancelText,
                    tooltip: this.cancelTitleText,
                    handler: this.hide,
                    scope: this
                }),
                new Ext.Button({
                    text: this.addServerText,
                    tooltip: this.addServerTitleText,
                    iconCls: "add",
                    handler: this.addServer,
                    scope: this
                })
            ];
        }



        this.items = this.form;

        gxp.NewSourceDialog.superclass.initComponent.call(this);

        this.form.on("render", function() {
            this.loadMask = new Ext.LoadMask(this.form.getEl(), {
                msg: this.contactingServerText
            });
        }, this);

        this.on({
            hide: this.reset,
            removed: this.reset,
            scope: this
        });

        this.on("urlselected", function(cmp, url) {
            this.setLoading();
            var failure = function() {
                this.setError(this.sourceLoadFailureMessage);
            };

            // this.explorer.addSource(url, null, success, failure, this);
            this.addSource(url, this.hide, failure, this);
        }, this);


        this.on("urlsaved", this.onUrlSaved, this);

    },

    /** API: method[onUrlSaved]
     *
     * Saved server callback
     */
    onUrlSaved: function(source) {
        console.log("Saved " + source.url + "!");
    },

    /** private: method[storeAndAddServer]
     *
     * Save server as gxp_wmscsource
     */
    storeAndAddServer: function() {
        // Clear validation before trying again.
        this.error = null;
        if (this.urlTextField.validate()) {
            this.fireEvent("urlselected", this, this.urlTextField.getValue());
            var url = this.urlTextField.getValue();
            var name = this.nameTextField.getValue();
            this.layerSourceAddHandler("gxp_wmscsource", url, name, "test");
        }
    },

    layerSourceAddHandler: function(ptype, url, name, config) {
        var isAuthorized = this.target.isAuthorizedIn("ROLE_ADMINISTRATOR");
        if (isAuthorized) {
            console.log("added new source!! " + url);
            Ext.Ajax.request({
                url: this.target.defaultRestUrl + '/persistenceGeo/saveSourceTool',
                method: 'POST',
                params: {
                    ptype: ptype,
                    sourceUrl: url,
                    name: name,
                    config: config
                },
                success: function(response) {
                    var json = Ext.util.JSON.decode(response.responseText);
                    var source = json.data;
                    this.fireEvent("urlsaved", source, this);
                },
                failure: function(response) {
                    console.log("Error saving " + url + "!");
                },
                scope: this
            });
        }
    }
});

/** api: xtype = pgeo_newsourcedialog */
Ext.reg('pgeo_newsourcedialog', PersistenceGeo.widgets.NewSourceDialog);