"use strict";

const archiver = require('archiver');
const fs = require('fs');

// 出力ZIPファイル名
const zip_file_name = './assets/src.zip';

// 出力ストリーム生成
const archive = archiver.create('zip', {});
const output = fs.createWriteStream(zip_file_name);
archive.pipe(output);

// アーカイブするファイルとフォルダの設定
const file = __dirname + '/src/index.js';
archive.append(fs.createReadStream(file), { name: 'index.js' });
archive.glob('node_modules/*');

// zip圧縮実行
archive.finalize();

// zip圧縮完了時
output.on('close', () => {
    console.log('complete!');
});

// zip圧縮失敗時
output.on('error', (e) => {
    console.error('Failure to zip... cause = ' +  e);
});
