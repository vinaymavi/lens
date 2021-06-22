/**
 * Copyright (c) 2021 OpenLens Authors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import "./hotbar-icon.scss";

import React, { DOMAttributes, useState } from "react";

import type { CatalogEntityContextMenu } from "../../../common/catalog";
import { cssNames, IClassName } from "../../utils";
import { ConfirmDialog } from "../confirm-dialog";
import { Menu, MenuItem } from "../menu";
import { MaterialTooltip } from "../material-tooltip/material-tooltip";
import { observer } from "mobx-react";
import { EntityIcon } from "../entity-icon";

export interface HotbarIconProps extends DOMAttributes<HTMLElement> {
  uid: string;
  title: string;
  source: string;
  src?: string;
  material?: string;
  onMenuOpen?: () => void;
  className?: IClassName;
  active?: boolean;
  menuItems?: CatalogEntityContextMenu[];
  disabled?: boolean;
  size?: number;
  background?: string;
}

function onMenuItemClick(menuItem: CatalogEntityContextMenu) {
  if (menuItem.confirm) {
    ConfirmDialog.open({
      okButtonProps: {
        primary: false,
        accent: true,
      },
      ok: () => {
        menuItem.onClick();
      },
      message: menuItem.confirm.message
    });
  } else {
    menuItem.onClick();
  }
}

export const HotbarIcon = observer(({menuItems = [], size = 40, ...props}: HotbarIconProps) => {
  const { uid, title, src, material, active, className, source, disabled, onMenuOpen, onClick, children, ...rest } = props;
  const id = `hotbarIcon-${uid}`;
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className={cssNames("HotbarIcon flex", className, { disabled })}>
      <MaterialTooltip title={`${title || "unknown"} (${source || "unknown"})`} placement="right">
        <div id={id}>
          <EntityIcon
            title={title}
            size={size}
            active={active}
            src={src}
            source={source}
            material={material}
            onClick={event => {
              if (!disabled) {
                onClick?.(event);
              }
            }}
            {...rest}
          />
          {children}
        </div>
      </MaterialTooltip>
      <Menu
        usePortal
        htmlFor={id}
        className="HotbarIconMenu"
        isOpen={menuOpen}
        toggleEvent="contextmenu"
        position={{right: true, bottom: true }} // FIXME: position does not work
        open={() => {
          if (!disabled) {
            onMenuOpen?.();
            toggleMenu();
          }
        }}
        close={() => toggleMenu()}>
        { menuItems.map((menuItem) => {
          return (
            <MenuItem key={menuItem.title} onClick={() => onMenuItemClick(menuItem) }>
              {menuItem.title}
            </MenuItem>
          );
        })}
      </Menu>
    </div>
  );
});
