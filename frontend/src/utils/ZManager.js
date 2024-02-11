export const updateZState = (e, zProps, cid) => {
    const zStack = zProps.zStack;
    const index = zStack.indexOf(cid);

    if (index + 1 === zStack.length) {
        // already at the top
        return;
    }

    let tempZStack = [...zStack];
    tempZStack.splice(index, 1);
    tempZStack.push(cid);
    zProps.setZStack(tempZStack);
}
