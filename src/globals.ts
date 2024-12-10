self.phet = self.phet || {};
self.phet.chipper = self.phet.chipper || {};

self.phet.chipper.packageObject = phet.chipper.packageObject || {
  'name': 'scenerystack'
};

self.phet.chipper.stringRepos = phet.chipper.stringRepos || [
  {
    'repo': 'joist',
    'requirejsNamespace': 'JOIST'
  },
  {
    'repo': 'scenery-phet',
    'requirejsNamespace': 'SCENERY_PHET'
  },
  {
    'repo': 'sun',
    'requirejsNamespace': 'SUN'
  },
  {
    'repo': 'tambo',
    'requirejsNamespace': 'TAMBO'
  },
  {
    'repo': 'vegas',
    'requirejsNamespace': 'VEGAS'
  }
];