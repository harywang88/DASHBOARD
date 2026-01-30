class Queue {
  constructor(concurrency = 2) {
    if (concurrency < 1 || !Number.isInteger(concurrency)) {
      throw new Error('concurrency must be a positive integer');
    }
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
    this.total = 0;
    this.completed = 0;
    this.failed = 0;
  }

  enqueue(fn) {
    if (typeof fn !== 'function') {
      throw new Error('enqueue requires a function');
    }
    const taskId = ++this.total;
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject, taskId });
      console.log(`Task ${taskId} enqueued (queue size: ${this.queue.length}, running: ${this.running})`);
      this._next();
    });
  }

  _next() {
    if (this.running >= this.concurrency) return;
    const item = this.queue.shift();
    if (!item) return;
    this.running++;
    const { taskId } = item;
    console.log(`Task ${taskId} started (${this.running}/${this.concurrency})`);
    Promise.resolve()
      .then(() => item.fn())
      .then(result => {
        this.completed++;
        console.log(`Task ${taskId} completed (total completed: ${this.completed})`);
        item.resolve(result);
      })
      .catch(err => {
        this.failed++;
        console.error(`Task ${taskId} failed:`, err.message);
        item.reject(err);
      })
      .finally(() => {
        this.running--;
        this._next();
      });
  }

  getStats() {
    return {
      total: this.total,
      completed: this.completed,
      failed: this.failed,
      running: this.running,
      queued: this.queue.length
    };
  }
}

module.exports = Queue;
