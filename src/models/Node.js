/**
 * Node entity - canonical note/item
 */
export class Node {
  constructor({
    id = crypto.randomUUID(),
    categoryId,
    title = '',
    contentMd = '',
    meta = {},
    flags = {},
    createdAt = Date.now(),
    updatedAt = Date.now()
  } = {}) {
    this.id = id;
    this.categoryId = categoryId;
    this.title = title;
    this.contentMd = contentMd;
    this.meta = meta; // Record<string, any>
    this.flags = flags; // { pinned?: boolean, archived?: boolean }
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  touch() {
    this.updatedAt = Date.now();
  }

  toJSON() {
    return {
      id: this.id,
      categoryId: this.categoryId,
      title: this.title,
      contentMd: this.contentMd,
      meta: this.meta,
      flags: this.flags,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromJSON(data) {
    return new Node(data);
  }
}
