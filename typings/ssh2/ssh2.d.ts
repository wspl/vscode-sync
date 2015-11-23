/**
 * https://github.com/Nessphoro/DeliveryTruck/blob/636f99271226133531a692bb66ab05233b078903/typings/ssh2.d.ts
 */

declare module "ssh2"
{
    module ssh2
    {
        export class Client
        {
            connect();
        }
    }

    export = ssh2;
}