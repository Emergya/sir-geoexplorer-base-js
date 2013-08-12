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
 * Author: Antonio Hernández <ahernandez@emergya.com>
 */

/**
 * @requires plugins/Tool.js
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = CreateBufferAction
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("gxp.plugins");

/** api: constructor
 *  .. class:: CreateBufferAction(config)
 *
 *    Provides an action for showing the default search dialog.
 */
gxp.plugins.CreateBufferAction = Ext.extend(gxp.plugins.Tool, {

    /** api: ptype = gxp_extendedtoolbar */
    ptype: "gxp_createbuffer",

    /** api: config[buttonText]
     *  ``String`` Text to show next to the zoom button
     */
    buttonText: 'Crear buffer',

    /** api: config[menuText]
     *  ``String``
     *  Text for zoom menu item (i18n).
     */
    menuText: 'Crear buffer',

    /** api: config[tooltip]
     *  ``String``
     *  Text for zoom action tooltip (i18n).
     */
    tooltip: 'Crear buffer',

    /** private: property[iconCls]
     */
    iconCls: 'vw-icon-buffer',

    /** private: property[toolAction]
     *  The action of the tool.
     */
    toolAction: null,

    /** private: method[constructor]
     */
    constructor: function(config) {
        gxp.plugins.CreateBufferAction.superclass.constructor.apply(this, arguments);
    },

    /** private: method[init]
     * :arg target: ``Object`` The object initializing this plugin.
     */
    init: function(target) {
        gxp.plugins.CreateBufferAction.superclass.init.apply(this, arguments);
        this.target.on('beforerender', this.addActions, this);

        this.target.on('render', this._handleSelectionChange, this);
    },

    /** private: method[_handleSelectionChange]
     */
    _handleSelectionChange: function() {
        var featureSelector = this._getFeatureSelector();
        featureSelector.on("selectionchanged", this._onFeatureSelectionChange, this);
    },

    _onFeatureSelectionChange : function(featureSelector, features) {
         this.selectedFeatures = features;

        if(features && features.length > 0) {
            this.toolAction.enable();

            var ds = Viewer.getComponent('NewBuffer');
            if(ds && !ds.hidden) {
                // We update the buffer with the newly selected features.
                ds.createPreviewBuffer();
            }

        } else {

            // We need to manually deactivate if disabled, as it seems
            // that the deactivateOnDisable property is not working here...
            this._deactivateButton();

            this.toolAction.disable();
        }
    },


    _getFeatureSelector : function() {
        return Viewer.getComponent(this.featureSelector);
    },

    /** api: method[addActions]
     */
    addActions: function() {
        var actions =  gxp.plugins.CreateBufferAction.superclass.addActions.apply(this, [{
            text: this.showButtonText ? this.buttonText : '',
            menuText: this.menuText,
            iconCls: this.iconCls,
            tooltip: this.tooltip,
            enableToggle: true,
            deactivateOnDisable: true,
            disabled: true,
            pressed: false,
            toggleHandler: function(action, evt) {

                var ds = Viewer.getComponent('NewBuffer');
                if (ds === undefined) {
                    var mapPanel = Viewer.getMapPanel();
                    ds = new Viewer.dialog.CreateBuffer({
                        mapPanel: mapPanel,
                        map: mapPanel.map,
                        action: this
                    });
                    Viewer.registerComponent('NewBuffer', ds);

                     ds.on("hide", function() {
                        // We deactivate the tool if we close the window.
                        this._deactivateButton();
                    },this);
                }
                if (action.pressed) {
                    ds.show();
                } else {
                    ds.hide();
                }
            },
            scope: this
        }]);

        this.toolAction = actions[0];

        return actions;
    },

    _deactivateButton : function() {
        if(this.toolAction.items[0].pressed){
            this.toolAction.items[0].toggle();
        }
    }
});

Ext.preg(gxp.plugins.CreateBufferAction.prototype.ptype, gxp.plugins.CreateBufferAction);
