// Simple CLI progress dot
export class Spinner {
  private started = false;

  start(text: string) {
    process.stdout.write(text + " ");
    this.started = true;
  }

  update(_text: string) {
    if (this.started) {
      process.stdout.write(".");
    }
  }

  stop(finalText?: string) {
    if (this.started) {
      process.stdout.write("\n");
      if (finalText) {
        process.stdout.write(finalText + "\n");
      }
      this.started = false;
    }
  }
}
