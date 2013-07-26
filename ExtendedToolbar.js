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
 * Author: Alejandro Díaz Torres <adiaz@emergya.com>
 */

/**
 * @requires plugins/Tool.js
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = ExtendedToolbar
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("gxp.plugins");

/** api: constructor
 *  .. class:: ExtendedToolbar(config)
 *
 *    Provides an action to include a known Ext.Toolbar as default action. 
 */
gxp.plugins.ExtendedToolbar = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = gxp_extendedtoolbar */
    ptype: "gxp_extendedtoolbar",
    
    /** api: config[buttonText]
     *  ``String`` Text to show next to the zoom button
     */
    buttonText: 'Extended Toolbar',
     
    /** api: config[menuText]
     *  ``String``
     *  Text for zoom menu item (i18n).
     */
    menuText: "Extended Toolbar",

    /** api: config[tooltip]
     *  ``String``
     *  Text for zoom action tooltip (i18n).
     */
    tooltip: "Extended Toolbar",
    
    /** private: property[iconCls]
     */
    iconCls: "vw-extended-toolbar",

    /** api: config[toolbar]
     *  ``String``
     *  The toolbar's class name.
     */
    toolbar: null,

    /** private: property[toolbarInstance]
     */
    toolbarInstance: null,

    /** api: config[targetParent]
     *  ``Object``
     *  The target parent for the toolbar. Usually ``Composer`` object.
     */
    targetParent: null,

    /** api: config[config]
     *  ``Object``
     *  Config to copy to the toolbar. Ussually parameters needed in actions.
     */
    config: null,

    /** api: config[extentedToolbarToogleGroup]
     *  ``String``
     *  Toogle group of the extended toolbar.
     *  Default is 'extendedToolbars'.
     */
    extentedToolbarToogleGroup: 'extendedToolbars',


    /** api: config[needsInit]
     *  ``Boolean``
     *  The tools cointaned in this toolbar need initialization when load.
     *  Default is true.
     */
    needsInit: true,
    
    /** private: method[constructor]
     */
    constructor: function(config) {
        gxp.plugins.ExtendedToolbar.superclass.constructor.apply(this, arguments);
    },

    /** api: method[addActions]
     */
    addActions: function() {
        if(this.needsInit){
            this.initToolbar();
        }
        return gxp.plugins.ExtendedToolbar.superclass.addActions.apply(this, [{
        	buttonText: this.showButtonText ? this.buttonText : '',
            menuText: this.menuText,
            iconCls: this.iconCls,
            tooltip: this.tooltip,
            enableToggle: true,
            toggleGroup: this.extentedToolbarToogleGroup,
            toggleHandler: function(button, state) {
                this.getToolbarInstance().setVisible(state);
            },
            scope: this
        }]);
    },

    /** api: method[initToolbar]
     *  Init toolbar components
     */
    initToolbar: function(){
        this.getToolbarInstance().setVisible(true);
        this.getToolbarInstance().setVisible(false);
    },

    /** api: method[getToolbarInstance]
     *  Obtain toolbar instance of this instance
     */
    getToolbarInstance: function(){
        if (!Viewer.widgets[this.toolbar]) {
            console.warn('TypeError: Viewer.widgets.%s is not a constructor.', this.toolbar);
            return;
        }

        var toolbarInstance = Viewer.getComponent(this.toolbar);

        if (toolbarInstance === undefined) {

            var mapPanel = Viewer.getMapPanel();
            var toolbarClass = Viewer.widgets[this.toolbar];

            var config = {
                mapPanel: mapPanel,
                target: this.targetParent
            };

            if(!!this.config){ // extends config
                Ext.apply(config, this.config);
            }
            
            toolbarInstance = new toolbarClass(config);

            Viewer.registerComponent(this.toolbar, toolbarInstance);
            this.target.mapPanel.add(toolbarInstance);
            this.target.mapPanel.doLayout();
        }
        return toolbarInstance;
    }
        
});

Ext.preg(gxp.plugins.ExtendedToolbar.prototype.ptype, gxp.plugins.ExtendedToolbar);
