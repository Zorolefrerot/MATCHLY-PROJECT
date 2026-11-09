import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import pngToIco from 'png-to-ico';

const source = resolve('../shopflow/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png');
const target = resolve('assets/shopflow.ico');
await mkdir(dirname(target), { recursive: true });
const icon = await pngToIco(source);
await writeFile(target, icon);
console.log(`Generated Windows icon: ${target}`);
