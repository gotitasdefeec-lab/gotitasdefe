const bcrypt = require('bcrypt');

const password = 'gotitas123';
const hash = '$2b$10$49qKNoduCZ2tdalMj9BlCe./bpDB3/Qg261dQoi2nuSKa22MHNaHK';

bcrypt.compare(password, hash).then(result => {
  console.log('Contraseña:', password);
  console.log('Hash:', hash);
  console.log('¿Coincide?:', result);
  
  if (!result) {
    // Intentar con admin123 que era la contraseña original
    bcrypt.compare('admin123', hash).then(r => {
      console.log('\nProbando con admin123:', r);
    });
  }
});
