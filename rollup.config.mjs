import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import copy from 'rollup-plugin-copy';

export default {
  input: 'src/wordcloud.ts',
  output: [
    {
      dir: 'dist',
      format: 'esm',
      sourcemap: true,
      entryFileNames: '[name].esm.js',
    },
    {
      dir: 'dist',
      format: 'esm',
      sourcemap: true,
      entryFileNames: '[name].esm.min.js',
      plugins: [terser()],
    },
    {
      dir: 'dist',
      format: 'umd',
      sourcemap: true,
      entryFileNames: '[name].js',
      name: 'Wordcloud',
    },
    {
      dir: 'dist',
      format: 'umd',
      sourcemap: true,
      entryFileNames: '[name].min.js',
      name: 'Wordcloud',
      plugins: [terser()],
    },
  ],
  plugins: [
    typescript({
      sourceMap: true,
    }),
    copy({
      targets: [{ src: 'src/wordcloud.css', dest: 'dist' }],
    }),
  ],
};
