/**
 * A tiny in-memory stand-in for the slice of the Firestore Admin SDK this codebase actually
 * uses (doc get/set/update/create/delete, collection where/orderBy/limit, subcollections,
 * and runTransaction). It is NOT a general-purpose Firestore emulator - just enough surface
 * area for the repositories in `src/repositories/*` to run unmodified in tests without a
 * real Firebase project. Writes apply immediately (no optimistic-concurrency retries); that's
 * fine here because we're testing business logic, not Firestore's own transaction semantics.
 */

type DocData = Record<string, unknown>;
type WhereOp = "==" | "in";

interface DocSnapshot {
  id: string;
  exists: boolean;
  data: () => DocData | undefined;
}

function makeSnapshot(id: string, data: DocData | undefined): DocSnapshot {
  return { id, exists: data !== undefined, data: () => data };
}

export class FakeFirestore {
  private store = new Map<string, DocData>();

  raw(path: string): DocData | undefined {
    return this.store.get(path);
  }

  write(path: string, data: DocData): void {
    this.store.set(path, data);
  }

  remove(path: string): void {
    this.store.delete(path);
  }

  childrenOf(collectionPath: string): Array<[string, DocData]> {
    const prefix = `${collectionPath}/`;
    const result: Array<[string, DocData]> = [];
    for (const [path, data] of this.store) {
      if (path.startsWith(prefix) && !path.slice(prefix.length).includes("/")) {
        result.push([path.slice(prefix.length), data]);
      }
    }
    return result;
  }

  collection(name: string): FakeCollectionRef {
    return new FakeCollectionRef(this, name);
  }

  async runTransaction<T>(fn: (tx: FakeTransaction) => Promise<T> | T): Promise<T> {
    return fn(new FakeTransaction(this));
  }

  reset(): void {
    this.store.clear();
  }
}

export class FakeTransaction {
  constructor(private db: FakeFirestore) {}

  get(ref: FakeDocRef): Promise<DocSnapshot> {
    return ref.get();
  }

  set(ref: FakeDocRef, data: DocData): void {
    void ref.set(data);
  }

  update(ref: FakeDocRef, patch: DocData): void {
    void ref.update(patch);
  }
}

export class FakeDocRef {
  constructor(
    private db: FakeFirestore,
    private path: string,
    public readonly id: string,
  ) {}

  collection(name: string): FakeCollectionRef {
    return new FakeCollectionRef(this.db, `${this.path}/${name}`);
  }

  async get(): Promise<DocSnapshot> {
    return makeSnapshot(this.id, this.db.raw(this.path));
  }

  async set(data: DocData, opts?: { merge?: boolean }): Promise<void> {
    const next = opts?.merge ? { ...(this.db.raw(this.path) ?? {}), ...data } : data;
    this.db.write(this.path, next);
  }

  async update(patch: DocData): Promise<void> {
    const current = this.db.raw(this.path);
    if (current === undefined) {
      throw new Error(`FakeFirestore: update() on missing document ${this.path}`);
    }
    this.db.write(this.path, { ...current, ...patch });
  }

  async create(data: DocData): Promise<void> {
    if (this.db.raw(this.path) !== undefined) {
      throw new Error(`FakeFirestore: create() on existing document ${this.path}`);
    }
    this.db.write(this.path, data);
  }

  async delete(): Promise<void> {
    this.db.remove(this.path);
  }
}

type Filter = (id: string, data: DocData) => boolean;

export class FakeQuery {
  constructor(
    private db: FakeFirestore,
    private collectionPath: string,
    private filters: Filter[] = [],
    private order?: { field: string; desc: boolean },
    private limitN?: number,
  ) {}

  where(field: string, op: WhereOp, value: unknown): FakeQuery {
    const filter: Filter = (id, data) => {
      const actual = field === "__name__" ? id : data[field];
      if (op === "==") return actual === value;
      if (op === "in") return Array.isArray(value) && value.includes(actual);
      throw new Error(`FakeFirestore: unsupported where operator ${op}`);
    };
    return new FakeQuery(this.db, this.collectionPath, [...this.filters, filter], this.order, this.limitN);
  }

  orderBy(field: string, direction: "asc" | "desc" = "asc"): FakeQuery {
    return new FakeQuery(this.db, this.collectionPath, this.filters, { field, desc: direction === "desc" }, this.limitN);
  }

  limit(n: number): FakeQuery {
    return new FakeQuery(this.db, this.collectionPath, this.filters, this.order, n);
  }

  async get(): Promise<{ docs: DocSnapshot[]; empty: boolean }> {
    let entries = this.db.childrenOf(this.collectionPath).filter(([id, data]) => this.filters.every((f) => f(id, data)));

    if (this.order) {
      const { field, desc } = this.order;
      entries = [...entries].sort((a, b) => {
        const av = a[1][field] as string | number;
        const bv = b[1][field] as string | number;
        if (av < bv) return desc ? 1 : -1;
        if (av > bv) return desc ? -1 : 1;
        return 0;
      });
    }
    if (this.limitN !== undefined) entries = entries.slice(0, this.limitN);

    const docs = entries.map(([id, data]) => makeSnapshot(id, data));
    return { docs, empty: docs.length === 0 };
  }
}

export class FakeCollectionRef extends FakeQuery {
  constructor(
    private dbRef: FakeFirestore,
    private path: string,
  ) {
    super(dbRef, path);
  }

  doc(id: string): FakeDocRef {
    return new FakeDocRef(this.dbRef, `${this.path}/${id}`, id);
  }
}
