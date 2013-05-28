/*
 * CssPermissionHandler.js Copyright (C) 2013 This file is part of PersistenceGeo project
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
 *  module = PersistenceGeo.permissions
 *  class = CssPermissionHandler
 */
Ext.namespace("PersistenceGeo.permissions");

/**
 * Class: PersistenceGeo.permissions.CssPermissionHandler
 * 
 * Permission handler
 * 
 */
PersistenceGeo.permissions.CssPermissionHandler = Ext.extend(PersistenceGeo.permissions.PermissionHandler,{

    /** Exclude buttons hide!! **/
    excludes: {"loginbutton":{}, "login":{}, "logout":{}},

    constructor: function(config) {
        Ext.apply(this, config);

        PersistenceGeo.permissions.PermissionHandler.superclass.constructor.apply(this, arguments);
    },

    /** private: method[handlePermission]
     *  Handle a permission.
     */
    handlePermission: function(permission, permissionConfig){
        //console.log("CSS HANDLE permission -->");
        var toolConfig = permissionConfig ? permissionConfig : this.searchPermission(permission);
        if(!!toolConfig){
           this.showHideButtonTool(toolConfig.scope, !toolConfig.permission);
        }
    },

    showHideButtonTool: function(tool, hide){
        var iconCls = [];
        if(tool.iconCls){
            iconCls[0] = tool.iconCls;
        }
        if(tool.actions 
            && tool.actions.length > 0){
            for (var i = 0; i< tool.actions.length; i++){
                if(!!tool.actions[i].initialConfig
                    && tool.actions[i].initialConfig.iconCls){
                    iconCls[iconCls.length] = tool.actions[i].initialConfig.iconCls;
                }
            }
        }
        if(iconCls.length>0){
            for (var iconIndex = 0; iconIndex< iconCls.length; iconIndex++){
                if(!(iconCls[iconIndex] in this.excludes)){
                    var buttons = $("."+iconCls[iconIndex]);
                    for(var i = 0; i <buttons.length; i++){
                       this.showHideButton(buttons[i], hide);
                    }
                }
            }
        }
    },

    showHideButton: function(element, hide, count){
        var countVar = count ? count: 0;
        if(element !=null){
            if(element.tagName == "TD"){
                countVar++; // Principal toolbar
            }
            // TODO: Use to hide and show tree contextMenu
            // else if(element.tagName == "LI"){
            //     countVar = 2; // Tree toolbar
            // }
            if(countVar == 2){
                if(hide){
                    element.style.display = "none";
                }else{
                    element.style.display = "";
                }
            }else{
                this.showHideButton(element.parentNode, hide, countVar);
            }
        }
    }

});
