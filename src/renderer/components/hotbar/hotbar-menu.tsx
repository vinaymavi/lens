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

import "./hotbar-menu.scss";

import React from "react";
import { observer } from "mobx-react";
import { HotbarEntityIcon } from "./hotbar-entity-icon";
import { cssNames, IClassName } from "../../utils";
import { catalogEntityRegistry } from "../../api/catalog-entity-registry";
import { defaultHotbarCells, HotbarItem, HotbarStore } from "../../../common/hotbar-store";
import type { CatalogEntity, CatalogEntityContextMenu } from "../../api/catalog-entity";
import { DragDropContext, Draggable, Droppable, DropResult } from "react-beautiful-dnd";
import { HotbarSelector } from "./hotbar-selector";
import { HotbarCell } from "./hotbar-cell";
import { HotbarIcon } from "./hotbar-icon";
import { computed } from "mobx";

interface Props {
  className?: IClassName;
}

@observer
export class HotbarMenu extends React.Component<Props> {
  get hotbar() {
    return HotbarStore.getInstance().getActive();
  }

  getEntity(item: HotbarItem) {
    const hotbar = HotbarStore.getInstance().getActive();

    if (!hotbar) {
      return null;
    }

    return item ? catalogEntityRegistry.items.find((entity) => entity.metadata.uid === item.entity.uid) : null;
  }

  onDragEnd(result: DropResult) {
    const { source, destination } = result;

    if (!destination) {  // Dropped outside of the list
      return;
    }

    const from = parseInt(source.droppableId);
    const to = parseInt(destination.droppableId);

    if (!this.hotbar.items[from]) { // Dropped non-persisted item
      this.hotbar.items[from] = this.items[from];
    }

    HotbarStore.getInstance().restackItems(from, to);
  }

  removeItem(uid: string) {
    const hotbar = HotbarStore.getInstance();

    hotbar.removeFromHotbar(uid);
  }

  addItem(entity: CatalogEntity, index = -1) {
    const hotbar = HotbarStore.getInstance();

    hotbar.addToHotbar(entity, index);
  }

  getMoveAwayDirection(entityId: string, cellIndex: number) {
    const draggableItemIndex = this.hotbar.items.findIndex(item => item?.entity.uid == entityId);

    return draggableItemIndex > cellIndex ? "animateDown" : "animateUp";
  }

  @computed get items() {
    const items = this.hotbar.items;
    const activeEntity = catalogEntityRegistry.activeEntity;

    if (!activeEntity) return items;

    const emptyIndex = items.indexOf(null);

    if (emptyIndex === -1) return items;
    if (items.find((item) => item?.entity?.uid === activeEntity.metadata.uid)) return items;

    const modifiedItems = [...items];

    modifiedItems.splice(emptyIndex, 1, { entity: { uid: activeEntity.metadata.uid }});

    return modifiedItems;
  }

  renderGrid() {
    return this.items.map((item, index) => {
      const entity = this.getEntity(item);
      const disabledMenuItems: CatalogEntityContextMenu[] = [
        {
          title: "Unpin from Hotbar",
          onClick: () => this.removeItem(item.entity.uid)
        }
      ];

      return (
        <Droppable droppableId={`${index}`} key={index}>
          {(provided, snapshot) => (
            <HotbarCell
              index={index}
              key={entity ? entity.getId() : `cell${index}`}
              innerRef={provided.innerRef}
              className={cssNames({
                isDraggingOver: snapshot.isDraggingOver,
                isDraggingOwner: snapshot.draggingOverWith == entity?.getId(),
              }, this.getMoveAwayDirection(snapshot.draggingOverWith, index))}
              {...provided.droppableProps}
            >
              {item && (
                <Draggable draggableId={item.entity.uid} key={item.entity.uid} index={0} >
                  {(provided, snapshot) => (
                    <div
                      key={item.entity.uid}
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        zIndex: defaultHotbarCells - index,
                        position: "absolute",
                        ...provided.draggableProps.style,
                      }}
                    >
                      {entity ? (
                        <HotbarEntityIcon
                          key={index}
                          index={index}
                          entity={entity}
                          className={cssNames({ isDragging: snapshot.isDragging })}
                          remove={this.removeItem}
                          add={this.addItem}
                          size={40}
                        />
                      ) : (
                        <HotbarIcon
                          uid={item.entity.uid}
                          title={item.entity.name}
                          source={item.entity.source}
                          menuItems={disabledMenuItems}
                          disabled
                          size={40}
                        />
                      )}
                    </div>
                  )}
                </Draggable>
              )}
              {provided.placeholder}
            </HotbarCell>
          )}
        </Droppable>
      );
    });
  }

  render() {
    const { className } = this.props;
    const hotbarStore = HotbarStore.getInstance();
    const hotbar = hotbarStore.getActive();

    return (
      <div className={cssNames("HotbarMenu flex column", className)}>
        <div className="HotbarItems flex column gaps">
          <DragDropContext onDragEnd={this.onDragEnd.bind(this)}>
            {this.renderGrid()}
          </DragDropContext>
        </div>
        <HotbarSelector hotbar={hotbar}/>
      </div>
    );
  }
}
