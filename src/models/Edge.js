/**
 * Edge entity - relationships between nodes
 * kind: 'contains' for hierarchy, 'link' for references
 */
export class Edge {
  constructor({
    id = crypto.randomUUID(),
    categoryId,
    fromId,
    toId,
    kind = 'contains', // 'contains' | 'link'
    label = '',
    order = 0,
    createdAt = Date.now()
  } = {}) {
    this.id = id;
    this.categoryId = categoryId;
    this.fromId = fromId;
    this.toId = toId;
    this.kind = kind;
    this.label = label;
    this.order = order;
    this.createdAt = createdAt;
  }

  toJSON() {
    return {
      id: this.id,
      categoryId: this.categoryId,
      fromId: this.fromId,
      toId: this.toId,
      kind: this.kind,
      label: this.label,
      order: this.order,
      createdAt: this.createdAt
    };
  }

  static fromJSON(data) {
    return new Edge(data);
  }
}
