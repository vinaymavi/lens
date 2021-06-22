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

import React, { DOMAttributes } from "react";
import { makeObservable, observable } from "mobx";
import { observer } from "mobx-react";

import type { CatalogEntity, CatalogEntityContextMenu, CatalogEntityContextMenuContext } from "../../../common/catalog";
import { catalogCategoryRegistry } from "../../api/catalog-category-registry";
import { catalogEntityRegistry } from "../../api/catalog-entity-registry";
import { navigate } from "../../navigation";
import { cssNames, IClassName } from "../../utils";
import { Icon } from "../icon";
import { HotbarIcon } from "./hotbar-icon";
import { HotbarStore } from "../../../common/hotbar-store";
import { catalogEntityRunContext } from "../../api/catalog-entity";

interface Props extends DOMAttributes<HTMLElement> {
  entity: CatalogEntity;
  index: number;
  className?: IClassName;
  errorClass?: IClassName;
  add: (item: CatalogEntity, index: number) => void;
  remove: (uid: string) => void;
  size?: number;
}

@observer
export class HotbarEntityIcon extends React.Component<Props> {
  @observable private contextMenu: CatalogEntityContextMenuContext = {
    menuItems: [],
    navigate: (url: string) => navigate(url),
  };

  constructor(props: Props) {
    super(props);
    makeObservable(this);
  }

  get kindIcon() {
    const className = "badge";
    const category = catalogCategoryRegistry.getCategoryForEntity(this.props.entity);

    if (!category) {
      return <Icon material="bug_report" className={className} />;
    }

    if (category.metadata.icon.includes("<svg")) {
      return <Icon svg={category.metadata.icon} className={className} />;
    } else {
      return <Icon material={category.metadata.icon} className={className} />;
    }
  }

  get ledIcon() {
    const className = cssNames("led", { online: this.props.entity.status.phase == "connected"}); // TODO: make it more generic

    return <div className={className} />;
  }

  isActive(item: CatalogEntity) {
    return catalogEntityRegistry.activeEntity?.metadata?.uid == item.getId();
  }

  isPersisted(entity: CatalogEntity) {
    return HotbarStore.getInstance().getActive().items.find((item) => item?.entity?.uid === entity.metadata.uid) !== undefined;
  }

  render() {
    const {
      entity, errorClass, add, remove,
      index, children, className, ...elemProps
    } = this.props;
    const classNames = cssNames("HotbarEntityIcon", className, {
      interactive: true,
      active: this.isActive(entity),
      disabled: !entity
    });

    console.log(entity);
    const isPersisted = this.isPersisted(entity);
    const onOpen = async () => {
      const menuItems: CatalogEntityContextMenu[] = [];

      if (!isPersisted) {
        menuItems.unshift({
          title: "Pin to Hotbar",
          onClick: () => add(entity, index)
        });
      } else {
        menuItems.unshift({
          title: "Unpin from Hotbar",
          onClick: () => remove(entity.metadata.uid)
        });
      }

      this.contextMenu.menuItems = menuItems;

      await entity.onContextMenuOpen(this.contextMenu);
    };
    const isActive = this.isActive(entity);

    return (
      <HotbarIcon
        uid={entity.metadata.uid}
        title={entity.metadata.name}
        source={entity.metadata.source}
        src={entity.spec.icon?.src}
        material={entity.spec.icon?.material}
        background={entity.spec.icon?.background}
        className={classNames}
        active={isActive}
        onMenuOpen={onOpen}
        menuItems={this.contextMenu.menuItems}
        onClick={() => entity.onRun(catalogEntityRunContext)}
        {...elemProps}
      >
        { this.ledIcon }
        { this.kindIcon }
      </HotbarIcon>
    );
  }
}
