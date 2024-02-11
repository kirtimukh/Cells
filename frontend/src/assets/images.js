import wkey from '@/assets/wkey.png'  // <a target="_blank" href="https://icons8.com/icon/e7T8GCKlORtw/w-key">W Key</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>
import akey from '@/assets/akey.png'  // <a target="_blank" href="https://icons8.com/icon/d5R01KYmFdiG/a-key">A Key</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>
import skey from '@/assets/skey.png'  // <a target="_blank" href="https://icons8.com/icon/OUQq3hOZ2mcF/s-key">S Key</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>
import dkey from '@/assets/dkey.png'  // <a target="_blank" href="https://icons8.com/icon/aa2GZ6X2ujlY/d-key">D Key</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>
import zkey from '@/assets/zkey.png'  // <a target="_blank" href="https://icons8.com/icon/l7U9yG7Ne51B/z-key">Z Key</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>
import ikey from '@/assets/ikey.png'  // <a target="_blank" href="https://icons8.com/icon/gvZnQ1kM5GbO/i-key">I Key</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>
import qkey from '@/assets/qkey.png'  // <a target="_blank" href="https://icons8.com/icon/TQH7CD22jPMt/q-key">Q Key</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>
import num1key from '@/assets/num1.png'
import num2key from '@/assets/num2.png'

import spacekey from '@/assets/spacekey.png'
import loadsaved from '@/assets/loadsaved.png'
import save from '@/assets/save.png'
import start from '@/assets/start.png'
import copy from '@/assets/copy.png'  // <a href="https://www.flaticon.com/free-icons/paper" title="paper icons">Paper icons created by Gregor Cresnar - Flaticon</a>
import check from '@/assets/check.png'  // <a href="https://www.flaticon.com/free-icons/tick" title="tick icons">Tick icons created by Dixit Lakhani_02 - Flaticon</a>
import hamburger from '@/assets/hamburger.png' // <a href="https://www.flaticon.com/free-icons/hamburger" title="hamburger icons">Hamburger icons created by Lizel Arina - Flaticon</a>
import downarrow from '@/assets/down-arrow.png' // <a href="https://www.flaticon.com/free-icons/down-arrow" title="down arrow icons">Down arrow icons created by th studio - Flaticon</a>

import cursor from '@/assets/cursor.png'  // <a target="_blank" href="https://icons8.com/icon/11648/cursor">Cursor</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>
import rightclick from '@/assets/rightclick.png'  // <a target="_blank" href="https://icons8.com/icon/2850/right-click">Right Click</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>


function cacheIconImage(imagePath, cacheKey) {
    fetch(imagePath)
        .then((response) => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.blob();
        })
        .then((blob) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result;
                localStorage.setItem(cacheKey, base64data);
            };
            reader.readAsDataURL(blob);
        })
        .catch((error) => console.error('Error fetching or converting image:', error)
    );
}

const iconImages = { wkey, akey, skey, dkey, zkey, spacekey, loadsaved, save, start, copy, check, hamburger, downarrow }


// for (const [key, value] of Object.entries(iconImages)) {
//     cacheIconImage(value, "icon_"+key)
// }

export { wkey, akey, skey, dkey, qkey, zkey, spacekey, loadsaved, save, start, copy, check, hamburger, downarrow, cursor, rightclick, num1key, num2key, ikey }
