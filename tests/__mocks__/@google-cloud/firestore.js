class FirestoreMock {
  constructor() {
    this.data = {};
  }

  collection(path) {
    return {
      doc: (docPath) => ({
        get: () => {
          const data = this.data[docPath] || {};

          return Promise.resolve({
            exists: Boolean(this.data[docPath]),
            data: () => data,
          });
        },
        set: (newData, options) => {
          this.data[docPath] = newData;
          return Promise.resolve();
        },
      }),
    };
  }
}

module.exports = { Firestore: FirestoreMock };
