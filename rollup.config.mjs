import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import copy from 'rollup-plugin-copy';
import nodeResolve from '@rollup/plugin-node-resolve';

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
    nodeResolve({
      extensions: ['.ts', '.js'],
    }),
    typescript(),
    copy({
      targets: [{ src: 'src/wordcloud.css', dest: 'dist' }],
    }),
  ],
};
