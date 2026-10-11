function getUniformProducts() {
  const products = [];
  const add = (id, name, gender, years, groups, colors = []) => {
    const sizePrices = {};
    const sizes = [];
    groups.forEach(([groupSizes, price]) => groupSizes.split(',').forEach(size => { sizes.push(size); sizePrices[size] = price; }));
    products.push({ id, name, gender, years, colors, category: 'Uniform', cost: 0,
      sizes, sizePrices, price: groups[0][1] });
  };
  const all = [1, 2, 3, 4, 5, 6];
  const upper = [4, 5, 6];
  const shirt = [['13,14,15,16', 33], ['17,18,19,20', 35]];
  const pants = [['19,20,21,22,23,24', 33], ['25,26', 35]];
  const girls = [['22,24,26,28,30,32', 22], ['34,36,38,40', 25]];
  const sports = '30,32,34,36,38,40';
  const letters = 'S,M,L,XL,2XL,3XL';
  const cadet = 'S,M,L,XL,2XL,3XL,4XL';
  const tops = ['HIJAU', 'PEACH', 'UNGU'];
  const bottoms = ['HIJAU', 'COKLAT', 'BLUE BLACK'];
  add('kemeja', 'Kemeja', 'Lelaki', all, shirt, tops);
  add('seluar-t1', 'Seluar', 'Lelaki', [1,2,3], pants, bottoms);
  add('seluar-t2', 'Seluar', 'Lelaki', upper, pants, [...bottoms, 'HITAM']);
  add('sukan-lelaki', 'Baju sukan', 'Lelaki', all, [[sports,30],[letters,32]]);
  add('kopiah', 'Kopiah', 'Lelaki', all, [['19.5,20,20.5,21,21.5,22,22.5,23',25]]);
  add('tali-leher', 'Tali leher', 'Lelaki', all, [['FREE SIZE',13]]);
  add('jubah', 'Jubah lelaki', 'Lelaki', upper, [['9,10,11,12,13,14,15',55]]);
  add('kadet-lelaki', 'Baju kadet', 'Lelaki', upper, [[cadet,75]]);
  add('beret-lelaki', 'Beret', 'Lelaki', upper, [['6,7,8',12]]);
  add('baju-perempuan', 'Baju perempuan', 'Perempuan', all, girls, tops);
  add('kain-perempuan', 'Kain perempuan', 'Perempuan', all, girls, bottoms);
  add('tudung-1', 'Tudung putih 1 lapis', 'Perempuan', [1,2], [['S,M,L,XL',15]], ['PUTIH']);
  add('tudung-2-t1', 'Tudung 2 lapis', 'Perempuan', [1,2,3], [['S,M',28],['L,XL',32]], ['PUTIH', 'PEACH', 'UNGU']);
  add('tudung-2-t2', 'Tudung 2 lapis', 'Perempuan', upper, [['S,M',28],['L,XL',32]], ['PUTIH', 'PEACH', 'UNGU', 'HITAM']);
  add('sukan-perempuan', 'Baju sukan', 'Perempuan', all, [[sports,32],[letters,35]]);
  add('kadet-perempuan', 'Baju kadet', 'Perempuan', upper, [[cadet,70]]);
  add('seluar-kadet', 'Seluar kadet', 'Perempuan', upper, pants, ['HITAM']);
  add('beret-perempuan', 'Beret', 'Perempuan', upper, [['6,7,8',12]]);
  return products;
}
